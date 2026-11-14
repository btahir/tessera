// Makes each theme's chime from the "chime" line in its theme.json.
//
//   FAL_KEY=... bun scripts/chimes.ts              every theme that has no chime yet
//   FAL_KEY=... bun scripts/chimes.ts pluvia       one theme, made again
//   bun scripts/chimes.ts pluvia --pick 2          use the third take already made
//
// It asks fal's Mirelo SFX model for three short takes, keeps them in
// .cache/chimes/<name>/, then trims the chosen one to 1.5 seconds, fades it out
// and levels its loudness, so all sixteen chimes sit at the same volume.
// Needs ffmpeg. A run of all sixteen costs about one dollar.

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { loadThemes, root } from './themes'

const ENDPOINT = 'https://fal.run/mirelo-ai/sfx2.0/text-to-audio'
const TAKES = 3
const args = process.argv.slice(2)
const pickAt = args.indexOf('--pick')
const pick = pickAt === -1 ? 0 : Number(args[pickAt + 1])
const only = args.find((arg, i) => !arg.startsWith('--') && (pickAt === -1 || i !== pickAt + 1))

const cacheOf = (name: string) => join(root, '.cache/chimes', name)
const takeOf = (name: string, i: number) => join(cacheOf(name), `${i}.mp3`)

const generate = async (name: string, prompt: string) => {
  const key = process.env.FAL_KEY

  if (key === undefined) {
    throw new Error('Set FAL_KEY to make new takes.')
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      negative_prompt: 'music, melody, voices, speech, harsh, loud, distortion',
      duration: 2,
      num_samples: TAKES,
      upload_audio_format: 'mp3',
    }),
  })

  if (!response.ok) {
    throw new Error(`fal answered ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }

  const { audio } = (await response.json()) as { audio: { url: string }[] }
  await mkdir(cacheOf(name), { recursive: true })

  for (const [i, take] of audio.entries()) {
    await Bun.write(takeOf(name, i), await fetch(take.url))
  }
}

// Trim the silence before the sound, hold it to 1.5 seconds, fade the tail, level the loudness.
const finish = async (from: string, to: string) => {
  const filter = [
    'silenceremove=start_periods=1:start_threshold=-45dB',
    'atrim=0:1.5',
    'afade=t=in:st=0:d=0.02',
    'afade=t=out:st=1.0:d=0.5',
    'loudnorm=I=-22:TP=-3:LRA=7',
  ].join(',')
  const run = Bun.spawn(['ffmpeg', '-loglevel', 'error', '-y', '-i', from, '-af', filter, '-ac', '1', '-ar', '44100', '-b:a', '96k', to])

  if ((await run.exited) !== 0) {
    throw new Error(`ffmpeg failed on ${from}`)
  }
}

// How long a finished chime runs, 0 when the file holds no sound.
const seconds = async (file: string) => {
  const probe = Bun.spawn(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { stdout: 'pipe', stderr: 'ignore' })

  return Number(await new Response(probe.stdout).text()) || 0
}

for (const theme of await loadThemes(only)) {
  const isNamed = only !== undefined
  const hasTake = await Bun.file(takeOf(theme.name, pick)).exists()

  if (!isNamed && theme.chimeFile !== null) {
    continue
  }

  if (pickAt === -1 || !hasTake) {
    console.log(`${theme.name}: asking for ${TAKES} takes`)
    await generate(theme.name, theme.chime)
  }

  // Use the take asked for, or else the first one that still holds a sound after trimming.
  const target = join(theme.dir, 'chime.mp3')
  const order = pickAt === -1 ? Array.from({ length: TAKES }, (_, i) => i) : [pick]
  let used: number | undefined

  for (const take of order) {
    await finish(takeOf(theme.name, take), target)

    if ((await seconds(target)) >= 0.6) {
      used = take
      break
    }
  }

  if (used === undefined) {
    throw new Error(`${theme.name}: no take held a sound. Change its "chime" line and run again.`)
  }

  console.log(`${theme.name}: chime.mp3 written from take ${used}`)
}
