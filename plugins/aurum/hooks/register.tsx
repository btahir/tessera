// The Tessera runtime: one hooks module shared by every theme plugin.
//
// `scripts/pack.ts` copies this file into each plugin beside a generated
// `themes.ts`. A single-theme plugin carries one theme. The `tessera` plugin
// carries all of them and switches between them by name.

import type { Hook, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { COMMAND, THEMES, type Theme } from './themes'

// What every hook is handed first: the engine.
type Engine = Parameters<Hook<'turn.start'>>[0]

// A turn this long may have lost your attention, so it ends with a chime.
const LONG_TURN_MS = 20_000

const isCollection = THEMES.length > 1

// A theme's colors are worked out once, the first time it is shown.
const looks = new Map<string, ThemeSetArgs>()

const lookOf = (theme: Theme): ThemeSetArgs => {
  const made = looks.get(theme.name)

  if (made !== undefined) {
    return made
  }

  const look: ThemeSetArgs = {
    colors: makeColors(theme.palette).theme,
    backdrop: { scene: theme.name, glass: theme.glass },
  }
  looks.set(theme.name, look)

  return look
}

const find = (name: unknown) => THEMES.find(theme => theme.name === name)

const help = (current: Theme) => {
  const switches = `/${COMMAND} still stops the motion and /${COMMAND} move starts it. For sound, /${COMMAND} quiet is silence, /${COMMAND} sound is a chime after long turns, and /${COMMAND} music adds the room's own sound while Claude works.`

  if (!isCollection) {
    return `${current.title}. ${switches}`
  }

  const names = THEMES.map(theme => theme.name).join(', ')

  return `Now showing ${current.title}. Type /${COMMAND} and a name to change it: ${names}. ${switches}`
}

export const register: Register = on => {
  // The person's choices, kept across sessions.
  let current: Theme = THEMES[0]!
  let hasMotion = true
  // quiet: no sound. sound: a chime after long turns. music: the chime, and the bed while working.
  let sound: 'quiet' | 'sound' | 'music' = 'sound'
  // The scene moves only while the main loop is working.
  let isWorking = false
  let turns = 0
  // Stops the bed that is playing, when one is.
  let bed: AbortController | undefined

  const stopBed = () => {
    bed?.abort()
    bed = undefined
  }

  // The room's own sound, looped quietly for as long as the turn runs.
  const startBed = ($: Engine) => {
    stopBed()

    if (sound !== 'music' || current.bed === null || !isWorking) {
      return
    }

    bed = new AbortController()
    void $.audio.play({ asset: current.bed }, { shouldLoop: true, gain: 0.3, signal: bed.signal }).catch(() => undefined)
  }

  on('session.start', async ($, e, next) => {
    current = find(await $.store.get('theme')) ?? current
    hasMotion = (await $.store.get('motion')) !== false
    const stored = await $.store.get('sound')
    sound = stored === 'quiet' || stored === 'music' ? stored : 'sound'

    await $.command.register({
      name: COMMAND,
      description: isCollection
        ? 'Tessera themes: pick one by name, or still, move, quiet, sound, music'
        : `${current.title} theme: still, move, quiet, sound or music`,
      argumentHint: isCollection ? 'name | still | move | quiet | sound | music' : 'still | move | quiet | sound | music',
    })

    await $.theme.set(lookOf(current))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === 'still' || word === 'move') {
      hasMotion = word === 'move'
      await $.store.set('motion', hasMotion)
      $.ui.invalidate('ui.render')

      return { text: hasMotion ? `${current.title} moves while Claude works.` : `${current.title} holds still.` }
    }

    if (word === 'quiet' || word === 'sound' || word === 'music') {
      sound = word
      await $.store.set('sound', sound)
      startBed($)

      const said = {
        quiet: `${current.title} is quiet.`,
        sound: `${current.title} chimes after long turns.`,
        music: `${current.title} plays while Claude works, and chimes after long turns.`,
      }

      return { text: said[word] }
    }

    const chosen = isCollection ? find(word) : undefined

    if (chosen === undefined) {
      return { text: help(current) }
    }

    current = chosen
    await $.store.set('theme', chosen.name)
    await $.theme.set(lookOf(chosen))
    $.ui.invalidate('ui.render')
    startBed($)

    return { text: `${chosen.title}. ${chosen.tagline}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const theme = e.props.plugin === $.plugin.name ? find(e.props.scene) : undefined

    if (theme === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const isMoving = hasMotion && isWorking
    // The same scene, held on one frame while there is an answer to read.
    const source = isMoving ? theme.scene : theme.scene.replace('<svg ', '<svg class="still" ')

    return <Svg source={source} alt={theme.alt} isInteractive />
  })

  // The spinner keeps the step the app names. Theme words stand in for "Working" alone.
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    const word = current.words[turns % current.words.length]

    if (word === undefined || e.props.message !== null || e.props.word !== 'Working') {
      return next(e)
    }

    return next({ ...e, props: { ...e.props, word, suffix: current.suffix ?? e.props.suffix } })
  })

  on('turn.start', ($, e, next) => {
    if (e.agentId === undefined) {
      isWorking = true
      $.ui.invalidate('ui.render')
      startBed($)
    }

    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (e.agentId !== undefined) {
      return next(e)
    }

    isWorking = false
    turns += 1
    $.ui.invalidate('ui.render')
    stopBed()

    if (sound !== 'quiet' && current.chime !== null && e.reason === 'answer' && e.durationMs >= LONG_TURN_MS) {
      // Not awaited: the chime plays while the answer settles.
      void $.audio.play({ asset: current.chime }, { gain: 0.5 }).catch(() => undefined)
    }

    return next(e)
  })

  on('session.end', ($, e, next) => {
    stopBed()

    return next(e)
  })
}
