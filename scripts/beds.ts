// Makes each theme's bed, the loop that plays while Claude works, from the
// "bed" entry in its theme.json.
//
//   bun scripts/beds.ts              every theme that has no bed yet
//   bun scripts/beds.ts pluvia       one theme, made again
//
// An "ambience" bed (rain, a fire, a room) comes from fal's Mirelo SFX model.
// A "music" bed comes from fal's Lyria model. The raw take is kept in
// .cache/beds/, then cut into a 20 second loop whose end fades into its start,
// so it repeats without a seam, and levelled so every bed is equally quiet.
// Needs FAL_KEY (a .env file here works) and ffmpeg. A full run costs a few dollars.

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { loadThemes, root, type LoadedTheme } from './themes'

const only = process.argv[2]
const cacheDir = join(root, '.cache/beds')
const LOOP = 20
const FADE = 2

const ask = async (endpoint: string, body: unknown) => {
  const key = process.env.FAL_KEY

  if (key === undefined) {
    throw new Error('Set FAL_KEY to make a bed.')
  }

  const response = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`fal answered ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }

  return response.json()
}

// The address of one raw take, at least 25 seconds long.
const generate = async (theme: LoadedTheme): Promise<string> => {
  if (theme.bed.kind === 'music') {
    const { audio } = (await ask('fal-ai/lyria3', {
      prompt: `${theme.bed.prompt}. Instrumental only, no vocals, calm and quiet background music, steady from the first second, no intro and no ending.`,
    })) as { audio: { url: string } }

    return audio.url
  }

  const { audio } = (await ask('mirelo-ai/sfx2.0/text-to-audio', {
    prompt: `${theme.bed.prompt}. A continuous even background ambience.`,
    negative_prompt: 'music, melody, voices, speech, sudden loud sounds, distortion',
    duration: 26,
    num_samples: 1,
    upload_audio_format: 'mp3',
  })) as { audio: { url: string }[] }

  return audio[0]!.url
}

// Cuts LOOP + FADE seconds, then fades the last FADE seconds into the first,
// so the end of the loop runs straight into its start.
const finish = async (from: string, to: string, skip: number) => {
  const filter = [
    `[0]atrim=${skip + FADE}:${skip + LOOP + FADE},asetpts=N/SR/TB[body]`,
    `[0]atrim=${skip}:${skip + FADE},asetpts=N/SR/TB[head]`,
    `[body][head]acrossfade=d=${FADE}:c1=tri:c2=tri,loudnorm=I=-26:TP=-6:LRA=7[out]`,
  ].join(';')
  const run = Bun.spawn(
    ['ffmpeg', '-loglevel', 'error', '-y', '-i', from, '-filter_complex', filter, '-map', '[out]', '-ac', '1', '-ar', '44100', '-b:a', '64k', to],
    { stderr: 'inherit' },
  )

  if ((await run.exited) !== 0) {
    throw new Error(`ffmpeg failed on ${from}`)
  }
}

await mkdir(cacheDir, { recursive: true })

for (const theme of await loadThemes(only)) {
  if (only === undefined && theme.bedFile !== null) {
    continue
  }

  const raw = join(cacheDir, `${theme.name}.mp3`)

  try {
    console.log(`${theme.name}: asking for ${theme.bed.kind}`)
    await Bun.write(raw, await fetch(await generate(theme)))
    // Music takes a moment to settle in, so its loop starts a little later.
    await finish(raw, join(theme.dir, 'bed.mp3'), theme.bed.kind === 'music' ? 4 : 1)
    console.log(`${theme.name}: bed.mp3 written`)
  } catch (error) {
    console.error(`${theme.name}: ${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  }
}
