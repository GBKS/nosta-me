import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { DAY, greetingOf, createSky, addGreeting, pileFromEvent, addPile, activeGreeting, pileAt, statsAt } from '@/helpers/gm/greetings.js'

const NOW = 1795600000
let counter = 0

// A fake note with a unique id; the sky doesn't check signatures itself.
function note(content, changes = {}) {
  counter++
  return {
    id: counter.toString(16).padStart(64, 'a'),
    pubkey: 'b'.repeat(64),
    kind: 1,
    created_at: NOW,
    tags: [],
    content,
    ...changes
  }
}

function reaction(target, changes = {}) {
  counter++
  return {
    id: counter.toString(16).padStart(64, 'c'),
    pubkey: 'd'.repeat(64),
    kind: 7,
    created_at: NOW + 60,
    tags: [['e', target.id], ['p', target.pubkey]],
    content: '+',
    ...changes
  }
}

describe('greetingOf', () => {
  it('recognises gm and gn in a few forms', () => {
    expect(greetingOf(note('gm'))).toBe('gm')
    expect(greetingOf(note('GM nostr ☕'))).toBe('gm')
    expect(greetingOf(note('gmmm'))).toBe('gm')
    expect(greetingOf(note('Good morning, friends'))).toBe('gm')
    expect(greetingOf(note('☀️'))).toBe('gm')
    expect(greetingOf(note('gn'))).toBe('gn')
    expect(greetingOf(note('Good night 🌙'))).toBe('gn')
  })

  it('ignores words that only start with gm or gn', () => {
    expect(greetingOf(note('gmail is down'))).toBe(null)
    expect(greetingOf(note('gnome update'))).toBe(null)
    expect(greetingOf(note('I said gm earlier'))).toBe(null)
  })

  it('ignores replies, other kinds and long notes', () => {
    expect(greetingOf(note('gm', { tags: [['e', 'x'.repeat(64)]] }))).toBe(null)
    expect(greetingOf(note('gm', { kind: 7 }))).toBe(null)
    expect(greetingOf(note('gm ' + 'a'.repeat(300)))).toBe(null)
    expect(greetingOf(null)).toBe(null)
  })
})

describe('addGreeting', () => {
  it('gives each person one sun and one moon', () => {
    const sky = createSky()
    expect(addGreeting(sky, note('gm')).isNewPerson).toBe(true)
    expect(addGreeting(sky, note('gn', { created_at: NOW + 3600 })).isNewPerson).toBe(true)
    expect(sky.people.size).toBe(2)
  })

  it('keeps the first greeting of a half day', () => {
    const sky = createSky()
    const later = note('gm again', { created_at: NOW + 600 })
    const first = note('gm')
    addGreeting(sky, later)
    addGreeting(sky, first)
    expect(addGreeting(sky, note('gm once more', { created_at: NOW + 900 }))).toBe(null)

    const person = sky.people.get('gm:' + 'b'.repeat(64))
    expect(person.greetings.map(g => g.id)).toEqual([first.id])
    expect(sky.byId.has(later.id)).toBe(false)
  })

  it('keeps greetings from different days, in order', () => {
    const sky = createSky()
    addGreeting(sky, note('gm', { created_at: NOW }))
    addGreeting(sky, note('gm', { created_at: NOW - DAY }))
    const person = sky.people.get('gm:' + 'b'.repeat(64))
    expect(person.greetings.map(g => g.t)).toEqual([NOW - DAY, NOW])
  })

  it('ignores duplicates and non-greetings', () => {
    const sky = createSky()
    const event = note('gm')
    expect(addGreeting(sky, event)).not.toBe(null)
    expect(addGreeting(sky, event)).toBe(null)
    expect(addGreeting(sky, note('hello'))).toBe(null)
  })
})

describe('the sky at a moment', () => {
  it('shows the latest greeting from the 24 hours before', () => {
    const sky = createSky()
    addGreeting(sky, note('gm', { created_at: NOW - DAY }))
    addGreeting(sky, note('gm', { created_at: NOW }))
    const person = sky.people.get('gm:' + 'b'.repeat(64))

    expect(activeGreeting(person, NOW + 10).t).toBe(NOW)
    expect(activeGreeting(person, NOW - 10).t).toBe(NOW - DAY)
    expect(activeGreeting(person, NOW - DAY - 10)).toBe(null)
    expect(activeGreeting(person, NOW + DAY + 10)).toBe(null)
  })

  it('counts pile-ins up to the moment shown, zaps twice', () => {
    const sky = createSky()
    const greeting = addGreeting(sky, note('gm')).greeting
    addPile(greeting, { t: NOW + 100, pubkey: 'x', zap: false, sats: 0 })
    addPile(greeting, { t: NOW + 200, pubkey: 'y', zap: true, sats: 21 })
    addPile(greeting, { t: NOW + 300, pubkey: 'z', zap: false, sats: 0 })

    expect(pileAt(greeting, NOW + 150)).toBe(1)
    expect(pileAt(greeting, NOW + 250)).toBe(3)
    expect(pileAt(greeting, NOW + 400)).toBe(4)
    expect(statsAt(greeting, NOW + 400)).toEqual({ people: 2, zaps: 1, sats: 21 })
  })
})

describe('pileFromEvent', () => {
  it('turns a reaction into a pile-in, once per person', () => {
    const sky = createSky()
    const event = note('gm')
    const greeting = addGreeting(sky, event).greeting

    const found = pileFromEvent(sky, reaction(event))
    expect(found.greeting).toBe(greeting)
    expect(found.pile).toMatchObject({ pubkey: 'd'.repeat(64), zap: false })
    expect(addPile(found.greeting, found.pile)).toBe(true)

    expect(pileFromEvent(sky, reaction(event))).toBe(null)
  })

  it('uses the last e tag and skips dislikes and unknown notes', () => {
    const sky = createSky()
    const event = note('gm')
    addGreeting(sky, event)

    expect(pileFromEvent(sky, reaction(event, { tags: [['e', 'f'.repeat(64)], ['e', event.id]] }))).not.toBe(null)
    expect(pileFromEvent(sky, reaction(event, { content: '-', pubkey: 'e'.repeat(64) }))).toBe(null)
    expect(pileFromEvent(sky, reaction(event, { tags: [['e', 'f'.repeat(64)]] }))).toBe(null)
  })

  it('ignores zap receipts that don\'t hold up', () => {
    const sky = createSky()
    const event = note('gm')
    addGreeting(sky, event)

    const receipt = finalizeEvent({
      kind: 9735,
      created_at: NOW,
      content: '',
      tags: [['e', event.id], ['p', event.pubkey], ['bolt11', 'lnbc1'], ['description', '{}']]
    }, generateSecretKey())
    expect(pileFromEvent(sky, receipt)).toBe(null)
  })
})
