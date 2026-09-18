import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import mitt from 'mitt'

// A stand-in for the relay connections, so no sockets are opened.
const fake = vi.hoisted(() => ({ connected: {}, subscriptions: [] }))

vi.mock('@/helpers/relayManager.js', () => {
  return {
    default: {
      isConnected: (relayId) => !!fake.connected[relayId],
      getConnection: (relayId) => ({
        subscribe: (filters, handlers) => {
          const subscription = { relayId, filters, handlers, close: vi.fn() }
          fake.subscriptions.push(subscription)
          return subscription
        }
      }),
      getConnector: () => ({ stats: { events: 0 } }),
      connectToRelay: vi.fn()
    }
  }
})

import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayRequest from '@/helpers/relayRequest.js'
import { useRelayStore } from '@/stores/relays.js'

const FILTERS = [{ kinds: [0], authors: ['a'.repeat(64)] }]
const EVENT = { id: '1'.repeat(64), pubkey: 'a'.repeat(64), kind: 1, tags: [], content: 'hi' }

function setRelay(relayId, isConnected) {
  useRelayStore().addRelay({ id: relayId, url: 'wss://' + relayId + '.example.com', status: isConnected ? 'connected' : null })
  fake.connected[relayId] = isConnected
}

function connectRelay(relayId) {
  setRelay(relayId, true)
  window.emitter.emit('relay-connect', { relayId })
  window.emitter.emit('relay-connect-' + relayId)
}

beforeEach(() => {
  window.emitter = mitt()
  fake.connected = {}
  fake.subscriptions = []
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('multiRelayRequest', () => {
  it('subscribes to connected relays and reports events with their relay', () => {
    setRelay('one', true)
    const callback = vi.fn()

    const request = multiRelayRequest()
    request.init(callback, vi.fn())
    request.start(['one'], FILTERS)

    expect(fake.subscriptions.length).toBe(1)
    expect(fake.subscriptions[0].filters).toBe(FILTERS)

    fake.subscriptions[0].handlers.onevent({ ...EVENT })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0].relay).toBe('one')
  })

  it('waits for relays that are not connected yet', () => {
    setRelay('late', false)

    const request = multiRelayRequest()
    request.init(vi.fn(), vi.fn())
    request.start(['late'], FILTERS)
    expect(fake.subscriptions.length).toBe(0)

    connectRelay('late')
    expect(fake.subscriptions.length).toBe(1)
  })

  it('does not subscribe after being stopped, when a relay connects late', () => {
    // This is how one profile's data could end up on another profile's page.
    setRelay('late', false)

    const request = multiRelayRequest()
    request.init(vi.fn(), vi.fn())
    request.start(['late'], FILTERS)
    request.stop()

    connectRelay('late')
    expect(fake.subscriptions.length).toBe(0)
  })

  it('closes its subscriptions and ignores their events after being stopped', () => {
    setRelay('one', true)
    const callback = vi.fn()

    const request = multiRelayRequest()
    request.init(callback, vi.fn())
    request.start(['one'], FILTERS)
    request.stop()

    expect(fake.subscriptions[0].close).toHaveBeenCalled()

    fake.subscriptions[0].handlers.onevent({ ...EVENT })
    expect(callback).not.toHaveBeenCalled()
  })

  it('gives up on relays that never connect', () => {
    setRelay('never', false)

    const request = multiRelayRequest()
    request.init(vi.fn(), vi.fn())
    request.start(['never'], FILTERS)

    vi.advanceTimersByTime(14000)
    expect(request.connectCallback).not.toBe(null)

    vi.advanceTimersByTime(2000)
    expect(request.connectCallback).toBe(null)

    connectRelay('never')
    expect(fake.subscriptions.length).toBe(0)
  })
})

describe('relayRequest', () => {
  it('does not subscribe after being stopped, when the relay connects late', () => {
    setRelay('late', false)

    const request = relayRequest()
    request.init(vi.fn(), true)
    request.start('late', FILTERS)
    request.stop()

    connectRelay('late')
    expect(fake.subscriptions.length).toBe(0)
  })

  it('subscribes once the relay connects, and only once', () => {
    setRelay('late', false)

    const request = relayRequest()
    request.init(vi.fn(), true)
    request.start('late', FILTERS)

    connectRelay('late')
    connectRelay('late')
    expect(fake.subscriptions.length).toBe(1)
  })

  it('gives up on a relay that never connects', () => {
    setRelay('never', false)

    const request = relayRequest()
    request.init(vi.fn(), true)
    request.start('never', FILTERS)

    vi.advanceTimersByTime(16000)
    connectRelay('never')
    expect(fake.subscriptions.length).toBe(0)
  })
})
