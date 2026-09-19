import { describe, it, expect } from 'vitest'
import publishTracker, { OUTCOME } from '@/helpers/create/publishTracker'

function tracker() {
  const result = publishTracker()
  result.expect('meta', ['a', 'b', 'c'])
  result.expect('relays', ['a', 'b', 'c'])
  result.expect('follows', ['a', 'b'])
  return result
}

describe('publishTracker', () => {
  it('is pending until results are in', () => {
    expect(publishTracker().summary().outcome).toBe(OUTCOME.PENDING)
    expect(tracker().summary().outcome).toBe(OUTCOME.PENDING)
  })

  it('succeeds once every event was accepted somewhere, without waiting for the rest', () => {
    const t = tracker()
    t.record('meta', 'a', 'success')
    t.record('relays', 'b', 'success')
    expect(t.summary().outcome).toBe(OUTCOME.PENDING)

    t.record('follows', 'a', 'success')
    expect(t.summary().outcome).toBe(OUTCOME.SUCCESS)
  })

  it('is not failed by the last relay to answer', () => {
    // What used to hang the save page: five good answers, then a bad one.
    const t = tracker()
    for(const name of ['meta', 'relays', 'follows']) t.record(name, 'a', 'success')
    for(const name of ['meta', 'relays', 'follows']) t.record(name, 'b', 'timeout')
    t.record('meta', 'c', 'error')
    t.record('relays', 'c', 'error')

    expect(t.summary().outcome).toBe(OUTCOME.SUCCESS)
  })

  it('ends as partial when some events made it and all relays have answered', () => {
    const t = tracker()
    t.record('meta', 'a', 'success')
    t.record('meta', 'b', 'error')
    t.record('meta', 'c', 'timeout')
    for(const relay of ['a', 'b', 'c']) t.record('relays', relay, 'timeout')
    t.record('follows', 'a', 'error')
    expect(t.summary().outcome).toBe(OUTCOME.PENDING)

    t.record('follows', 'b', 'timeout')
    const summary = t.summary()

    expect(summary.outcome).toBe(OUTCOME.PARTIAL)
    expect(summary.events.meta.saved).toBe(true)
    expect(summary.events.relays.saved).toBe(false)
    expect(summary.events.follows.saved).toBe(false)
  })

  it('ends as an error when nothing made it', () => {
    const t = tracker()
    for(const relay of ['a', 'b', 'c']) { t.record('meta', relay, 'timeout'); t.record('relays', relay, 'error') }
    for(const relay of ['a', 'b']) t.record('follows', relay, 'timeout')

    expect(t.summary().outcome).toBe(OUTCOME.ERROR)
  })

  it('can give up on relays that never answer', () => {
    const t = tracker()
    t.record('meta', 'a', 'success')
    t.giveUp()

    expect(t.summary().outcome).toBe(OUTCOME.PARTIAL)
    expect(t.summary().events.meta.pending).toBe(0)
  })

  it('keeps a success when the same relay reports a timeout too', () => {
    const t = tracker()
    t.record('meta', 'a', 'success')
    t.record('meta', 'a', 'timeout')
    expect(t.summary().events.meta.accepted).toBe(1)

    // And upgrades a timeout when the relay accepts the event after all
    t.record('relays', 'a', 'timeout')
    t.record('relays', 'a', 'success')
    expect(t.summary().events.relays.saved).toBe(true)
  })

  it('counts results from relays it was not told about', () => {
    const t = publishTracker()
    t.record('meta', 'x', 'success')

    expect(t.summary().events.meta).toEqual({ relays: 1, accepted: 1, pending: 0, saved: true })
  })
})
