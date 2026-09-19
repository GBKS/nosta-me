import { describe, it, expect } from 'vitest'
import listHelper, { LIST_TYPES } from '@/helpers/listHelper'

const ALICE = 'a'.repeat(64)
const BOB = 'b'.repeat(64)

function list(kind, created_at, tags = [], pubkey = ALICE) {
  return { id: kind + '-' + created_at + '-' + JSON.stringify(tags).length, kind, pubkey, created_at, tags }
}

describe('listHelper.latestVersions', () => {
  it('keeps the newest version of a standard list', () => {
    const older = list(10003, 100, [['e', '1'.repeat(64)]])
    const newer = list(10003, 200, [['e', '2'.repeat(64)]])

    expect(listHelper.latestVersions([older, newer])).toEqual([newer])
    expect(listHelper.latestVersions([newer, older])).toEqual([newer])
  })

  it('tells sets apart by their "d" tag', () => {
    const friends = list(30000, 100, [['d', 'friends']])
    const friendsNewer = list(30000, 200, [['d', 'friends'], ['p', BOB]])
    const work = list(30000, 150, [['d', 'work']])

    expect(listHelper.latestVersions([friends, work, friendsNewer])).toEqual([friendsNewer, work])
  })

  it('ignores the "d" tag of standard lists, there is only one of each', () => {
    const older = list(10000, 100, [['d', 'something']])
    const newer = list(10000, 200, [])

    expect(listHelper.latestVersions([older, newer])).toEqual([newer])
  })

  it('keeps lists of different kinds and people apart', () => {
    const mutes = list(10000, 100)
    const bookmarks = list(10003, 100)
    const bobsMutes = list(10000, 100, [], BOB)

    expect(listHelper.latestVersions([mutes, bookmarks, bobsMutes]).length).toBe(3)
  })

  it('copes with nothing and with broken events', () => {
    expect(listHelper.latestVersions(null)).toEqual([])
    expect(listHelper.latestVersions([null, {}, { kind: 10000 }])).toEqual([])
  })
})

describe('listHelper.entryCount', () => {
  it('counts entries, not the tags that describe the list', () => {
    const event = list(39089, 100, [
      ['d', 'abc'], ['title', 'Designers'], ['description', 'People who design'], ['image', 'https://example.com/a.jpg'],
      ['p', ALICE], ['p', BOB]
    ])

    expect(listHelper.entryCount(event)).toBe(2)
  })

  it('knows the entries of the newer lists', () => {
    expect(listHelper.entryCount(list(10009, 1, [['group', 'abc', 'wss://groups.example.com'], ['r', 'wss://groups.example.com']]))).toBe(2)
    expect(listHelper.entryCount(list(10063, 1, [['server', 'https://blossom.example.com']]))).toBe(1)
    expect(listHelper.entryCount(list(10050, 1, [['relay', 'wss://inbox.example.com']]))).toBe(1)
    expect(listHelper.entryCount({ kind: 10000 })).toBe(0)
  })
})

describe('listHelper.type', () => {
  it('finds the type, or a stand-in for kinds we do not know', () => {
    expect(listHelper.type({ kind: 39089 }).id).toBe('starter-pack')
    expect(listHelper.type({ kind: 12345 }).id).toBe('unknown')
  })

  it('has what the list item needs for every type', () => {
    for(const type of LIST_TYPES) {
      expect(type.name, type.id).toBeTruthy()
      expect(type.title, type.id).toContain('{count}')
      expect(['mute', 'pin', 'bookmarks', 'people'], type.id).toContain(type.image)
      // Only sets can be linked to, and all of them are
      expect(!!type.link, type.id).toBe(type.kind >= 30000)
    }

    const kinds = listHelper.kinds()
    expect(new Set(kinds).size).toBe(kinds.length)
  })

  it('stays away from kinds that mean something else on this site', () => {
    const kinds = listHelper.kinds()
    // Relay list, profile badges, external identities, badge sets
    for(const kind of [10002, 10008, 10011, 30008]) {
      expect(kinds).not.toContain(kind)
    }
  })
})
