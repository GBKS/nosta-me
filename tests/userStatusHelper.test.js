import { describe, it, expect } from 'vitest'
import userStatusHelper, { MAX_LENGTH } from '@/helpers/userStatusHelper'

const NOW = 1760000000
const KEY = 'a'.repeat(64)

function status(content, createdAt, tags = []) {
  return { kind: 30315, created_at: createdAt, content, tags: [['d', 'general'], ...tags] }
}

describe('userStatusHelper.buildEvent', () => {
  it('builds a general status with a link and an expiration', () => {
    const event = userStatusHelper.buildEvent({ publicKey: KEY, text: ' Out for lunch ', link: 'example.com/menu', durationId: '1h', now: NOW })

    expect(event).toEqual({
      pubkey: KEY,
      created_at: NOW,
      kind: 30315,
      tags: [['d', 'general'], ['r', 'https://example.com/menu'], ['expiration', String(NOW + 3600)]],
      content: 'Out for lunch'
    })
  })

  it('keeps a status without a link or an expiration', () => {
    const event = userStatusHelper.buildEvent({ publicKey: KEY, text: 'Working', link: '', durationId: 'never', now: NOW })

    expect(event.tags).toEqual([['d', 'general']])
  })

  it('clears the status with an empty one, without a link or an expiration', () => {
    const event = userStatusHelper.buildEvent({ publicKey: KEY, text: '   ', link: 'https://example.com', durationId: '1h', now: NOW })

    expect(event.content).toBe('')
    expect(event.tags).toEqual([['d', 'general']])
  })

  it('cuts off long statuses', () => {
    const event = userStatusHelper.buildEvent({ publicKey: KEY, text: 'x'.repeat(200), now: NOW })

    expect(event.content.length).toBe(MAX_LENGTH)
  })
})

describe('userStatusHelper.normalizeLink', () => {
  it('accepts websites', () => {
    expect(userStatusHelper.normalizeLink('https://example.com')).toBe('https://example.com/')
    expect(userStatusHelper.normalizeLink('http://example.com/a?b=c')).toBe('http://example.com/a?b=c')
    expect(userStatusHelper.normalizeLink(' example.com ')).toBe('https://example.com/')
  })

  it('leaves out what is not a website', () => {
    expect(userStatusHelper.normalizeLink('')).toBeNull()
    expect(userStatusHelper.normalizeLink(null)).toBeNull()
    expect(userStatusHelper.normalizeLink('javascript:alert(1)')).toBeNull()
    expect(userStatusHelper.normalizeLink('nostr:npub1abc')).toBeNull()
    expect(userStatusHelper.normalizeLink('not a link')).toBeNull()
    expect(userStatusHelper.normalizeLink('localhost')).toBeNull()
  })
})

describe('userStatusHelper.current', () => {
  it('picks the newest general status', () => {
    const events = [status('Old', NOW - 100), status('New', NOW - 10), status('Older', NOW - 1000)]

    expect(userStatusHelper.current(events, NOW).content).toBe('New')
  })

  it('ignores music statuses', () => {
    const music = { kind: 30315, created_at: NOW, content: 'A song', tags: [['d', 'music']] }

    expect(userStatusHelper.current([music, status('Working', NOW - 10)], NOW).content).toBe('Working')
  })

  it('has no status when the newest one is empty or expired', () => {
    expect(userStatusHelper.current([status('Working', NOW - 100), status('', NOW - 10)], NOW)).toBeNull()
    expect(userStatusHelper.current([status('Lunch', NOW - 100, [['expiration', String(NOW - 1)]])], NOW)).toBeNull()
    expect(userStatusHelper.current([], NOW)).toBeNull()
    expect(userStatusHelper.current(null, NOW)).toBeNull()
  })

  it('keeps a status that has not expired yet', () => {
    const event = status('Lunch', NOW - 100, [['expiration', String(NOW + 60)]])

    expect(userStatusHelper.current([event], NOW)).toBe(event)
    expect(userStatusHelper.expiration(event)).toBe(NOW + 60)
  })
})
