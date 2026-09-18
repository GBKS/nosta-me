import { describe, it, expect } from 'vitest'
import badgeHelper from '@/helpers/badgeHelper'

const ALICE = 'a'.repeat(64) // Issues badges
const BOB = 'b'.repeat(64) // Displays them

function pair(identifier, awardId, relay) {
  const award = ['e', awardId]
  if(relay) award.push(relay)

  return [['a', '30009:' + ALICE + ':' + identifier], award]
}

function profileBadges(tags, created_at = 100) {
  return { id: 'new-' + created_at, kind: 10008, pubkey: BOB, created_at, tags }
}

function legacyProfileBadges(tags, created_at = 100) {
  return {
    id: 'old-' + created_at,
    kind: 30008,
    pubkey: BOB,
    created_at,
    tags: [['d', 'profile_badges'], ...tags]
  }
}

describe('badgeHelper.profileBadges', () => {
  it('returns every badge in the list, in order', () => {
    const event = profileBadges([
      ...pair('bravery', '1'.repeat(64), 'wss://relay.example.com'),
      ...pair('honor', '2'.repeat(64))
    ])

    expect(badgeHelper.profileBadges([event])).toEqual([
      {
        address: '30009:' + ALICE + ':bravery',
        kind: 30009,
        pubkey: ALICE,
        identifier: 'bravery',
        awardId: '1'.repeat(64),
        relayHint: 'wss://relay.example.com'
      },
      {
        address: '30009:' + ALICE + ':honor',
        kind: 30009,
        pubkey: ALICE,
        identifier: 'honor',
        awardId: '2'.repeat(64),
        relayHint: null
      }
    ])
  })

  it('reads the deprecated kind 30008 profile_badges event', () => {
    const event = legacyProfileBadges([
      ...pair('bravery', '1'.repeat(64)),
      ...pair('honor', '2'.repeat(64))
    ])

    const result = badgeHelper.profileBadges([event])
    expect(result.map(badge => badge.identifier)).toEqual(['bravery', 'honor'])
  })

  it('uses the newest event, whichever kind it is', () => {
    const older = legacyProfileBadges(pair('bravery', '1'.repeat(64)), 100)
    const newer = profileBadges(pair('honor', '2'.repeat(64)), 200)
    const newestLegacy = legacyProfileBadges(pair('wisdom', '3'.repeat(64)), 300)

    expect(badgeHelper.profileBadges([older, newer])[0].identifier).toBe('honor')
    expect(badgeHelper.profileBadges([newer, older])[0].identifier).toBe('honor')
    expect(badgeHelper.profileBadges([older, newer, newestLegacy])[0].identifier).toBe('wisdom')
  })

  it('ignores badge sets, which share kind 30008', () => {
    const badgeSet = {
      id: 'set',
      kind: 30008,
      pubkey: BOB,
      created_at: 500,
      tags: [['d', 'favourites'], ...pair('bravery', '1'.repeat(64))]
    }

    expect(badgeHelper.profileBadges([badgeSet])).toEqual([])

    const event = profileBadges(pair('honor', '2'.repeat(64)), 100)
    expect(badgeHelper.profileBadges([badgeSet, event])[0].identifier).toBe('honor')
  })

  it('ignores an "a" tag without the "e" tag right after it, and the other way around', () => {
    const event = profileBadges([
      ['a', '30009:' + ALICE + ':lonely'],
      ...pair('bravery', '1'.repeat(64)),
      ['e', '9'.repeat(64)],
      ['a', '30009:' + ALICE + ':last']
    ])

    const result = badgeHelper.profileBadges([event])
    expect(result.map(badge => badge.identifier)).toEqual(['bravery'])
  })

  it('ignores references to anything but a badge definition', () => {
    const event = profileBadges([
      ['a', '30008:' + BOB + ':favourites'], // A badge set
      ['e', '1'.repeat(64)],
      ['a', '30009'],
      ['e', '2'.repeat(64)],
      ['a'],
      ['e']
    ])

    expect(badgeHelper.profileBadges([event])).toEqual([])
  })

  it('keeps colons in the identifier and an empty identifier', () => {
    const event = profileBadges([
      ...pair('club:2024:gold', '1'.repeat(64)),
      ...pair('', '2'.repeat(64))
    ])

    const result = badgeHelper.profileBadges([event])
    expect(result.map(badge => badge.identifier)).toEqual(['club:2024:gold', ''])
  })

  it('lists a badge once', () => {
    const event = profileBadges([
      ...pair('bravery', '1'.repeat(64)),
      ...pair('bravery', '2'.repeat(64))
    ])

    expect(badgeHelper.profileBadges([event]).length).toBe(1)
  })

  it('copes with nothing, and with events that have no tags', () => {
    expect(badgeHelper.profileBadges(null)).toEqual([])
    expect(badgeHelper.profileBadges([])).toEqual([])
    expect(badgeHelper.profileBadges([{ kind: 10008, created_at: 1 }])).toEqual([])
    expect(badgeHelper.profileBadges([profileBadges([])])).toEqual([])
  })
})
