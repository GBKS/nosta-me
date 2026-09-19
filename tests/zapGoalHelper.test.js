import { describe, it, expect } from 'vitest'
import zapGoalHelper from '@/helpers/zapGoalHelper'

const ALICE = 'a'.repeat(64)
const BOB = 'b'.repeat(64)
const NOW = 1800000000

function goalEvent(tags, content = 'Travel to the conference', created_at = NOW - 1000, id = 'g'.repeat(64)) {
  return { id, kind: 9041, pubkey: ALICE, created_at, content, tags }
}

function zap(changes = {}) {
  return { id: 'z1', requestId: 'r1', eventId: 'g'.repeat(64), recipient: ALICE, sender: BOB, sats: 1000, created_at: NOW - 500, ...changes }
}

describe('zapGoalHelper.parse', () => {
  it('reads a goal, the amount is in millisats', () => {
    const goal = zapGoalHelper.parse(goalEvent([
      ['relays', 'wss://one.example.com', 'wss://two.example.com'],
      ['amount', '21000000'],
      ['closed_at', String(NOW + 1000)]
    ]))

    expect(goal.text).toBe('Travel to the conference')
    expect(goal.targetSats).toBe(21000)
    expect(goal.closedAt).toBe(NOW + 1000)
    expect(goal.relays).toEqual(['wss://one.example.com', 'wss://two.example.com'])
  })

  it('skips what other apps publish under this kind, and broken amounts', () => {
    // Seen in the wild: no amount, but a category and a currency
    expect(zapGoalHelper.parse(goalEvent([['d', 'abc'], ['category', 'food'], ['currency', 'USD']]))).toBeNull()

    for(const amount of ['0', '-5', 'lots', '999', '1e9', '', '9'.repeat(30)]) {
      expect(zapGoalHelper.parse(goalEvent([['amount', amount]])), amount).toBeNull()
    }
  })

  it('needs something to say what the goal is for, the summary will do', () => {
    expect(zapGoalHelper.parse(goalEvent([['amount', '5000']], '   '))).toBeNull()
    expect(zapGoalHelper.parse(goalEvent([['amount', '5000'], ['summary', 'New microphone']], '')).text).toBe('New microphone')
  })

  it('only keeps relay URLs, three at the most', () => {
    const goal = zapGoalHelper.parse(goalEvent([
      ['amount', '5000'],
      ['relays', 'wss://one.example.com', 'https://not-a-relay.example.com', 'ws://insecure.example.com', null, 'wss://two.example.com', 'wss://three.example.com', 'wss://four.example.com']
    ]))

    expect(goal.relays).toEqual(['wss://one.example.com', 'wss://two.example.com', 'wss://three.example.com'])
  })

  it('works without the relays tag, which some goals lack', () => {
    expect(zapGoalHelper.parse(goalEvent([['amount', '2100000']])).relays).toEqual([])
  })
})

describe('zapGoalHelper.openGoals', () => {
  it('returns goals that still take contributions, newest first', () => {
    const events = [
      goalEvent([['amount', '5000']], 'Old but open', NOW - 5000, '1'.repeat(64)),
      goalEvent([['amount', '5000'], ['closed_at', String(NOW - 10)]], 'Closed', NOW - 100, '2'.repeat(64)),
      goalEvent([['amount', '5000'], ['closed_at', String(NOW + 10)]], 'Closing soon', NOW - 200, '3'.repeat(64)),
      goalEvent([['category', 'food']], 'Not a goal', NOW - 50, '4'.repeat(64))
    ]

    expect(zapGoalHelper.openGoals(events, NOW).map(goal => goal.text)).toEqual(['Closing soon', 'Old but open'])
    expect(zapGoalHelper.openGoals(events, NOW, 1).map(goal => goal.text)).toEqual(['Closing soon'])
    expect(zapGoalHelper.openGoals(null, NOW)).toEqual([])
  })
})

describe('zapGoalHelper.openGoals, goals that were never closed', () => {
  const DAY = 24 * 60 * 60

  it('shows a goal that is posted again every day only once, the newest', () => {
    const events = [
      goalEvent([['amount', '5000']], 'Feed the goats', NOW - 2 * DAY, '1'.repeat(64)),
      goalEvent([['amount', '5000']], 'Feed the goats', NOW - DAY, '2'.repeat(64)),
      goalEvent([['amount', '5000']], 'Feed the goats', NOW - 3 * DAY, '3'.repeat(64))
    ]

    const result = zapGoalHelper.openGoals(events, NOW)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2'.repeat(64))
  })

  it('takes a goal without an end to be over after half a year', () => {
    const events = [
      goalEvent([['amount', '5000']], 'Recent', NOW - 100 * DAY, '1'.repeat(64)),
      goalEvent([['amount', '5000']], 'Long ago', NOW - 200 * DAY, '2'.repeat(64)),
      // An end date in the future counts, however old the goal is
      goalEvent([['amount', '5000'], ['closed_at', String(NOW + DAY)]], 'Long running', NOW - 400 * DAY, '3'.repeat(64))
    ]

    expect(zapGoalHelper.openGoals(events, NOW).map(goal => goal.text)).toEqual(['Recent', 'Long running'])
  })
})

describe('zapGoalHelper.progress', () => {
  const goal = zapGoalHelper.parse(goalEvent([['amount', '10000000'], ['closed_at', String(NOW)]]))

  it('adds up the zaps on the goal', () => {
    const result = zapGoalHelper.progress(goal, [zap(), zap({ id: 'z2', requestId: 'r2', sats: 1500 })])

    expect(result).toEqual({ sats: 2500, count: 2, percent: 25 })
  })

  it('leaves out zaps that do not count', () => {
    const result = zapGoalHelper.progress(goal, [
      zap(),
      zap({ id: 'z2', requestId: 'r1' }), // A second receipt for the same payment
      zap({ id: 'z3', requestId: 'r3', eventId: 'x'.repeat(64) }), // For another event
      zap({ id: 'z4', requestId: 'r4', eventId: null }), // For the person
      zap({ id: 'z5', requestId: 'r5', recipient: BOB }), // To someone else
      zap({ id: 'z6', requestId: 'r6', created_at: NOW + 1 }), // After the goal closed
      null
    ])

    expect(result).toEqual({ sats: 1000, count: 1, percent: 10 })
  })

  it('does not go over 100 percent', () => {
    expect(zapGoalHelper.progress(goal, [zap({ sats: 50000 })]).percent).toBe(100)
    expect(zapGoalHelper.progress(goal, []).percent).toBe(0)
  })
})
