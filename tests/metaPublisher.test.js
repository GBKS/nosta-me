import { describe, it, expect, vi } from 'vitest'

// Nothing is connected to or published in these tests.
vi.mock('@/helpers/relayManager.js', () => {
  return { default: { addRelayByUrl: () => 'test-relay' } }
})

import metaPublisher from '@/helpers/create/metaPublisher.js'

// Stops right before signing and returns the event that would be signed.
function eventToSign(...args) {
  const publisher = metaPublisher()
  publisher.signEvent = vi.fn()
  publisher.publish(() => {}, ...args)

  return publisher.signEvent.mock.calls[0][0]
}

describe('metaPublisher.publish', () => {
  it('keeps the tags of the profile that is being edited', () => {
    const tags = [['i', 'github:gbks', 'abc123'], ['client', 'Some app']]
    const event = eventToSign({ name: 'Alice' }, ['test-relay'], tags)

    expect(event.kind).toBe(0)
    expect(event.tags).toEqual(tags)
    expect(JSON.parse(event.content)).toEqual({ name: 'Alice' })
  })

  it('publishes no tags when there are none, like for a new profile', () => {
    expect(eventToSign({ name: 'Alice' }, ['test-relay']).tags).toEqual([])
    expect(eventToSign({ name: 'Alice' }, ['test-relay'], null).tags).toEqual([])
    expect(eventToSign({ name: 'Alice' }, ['test-relay'], 'nonsense').tags).toEqual([])
  })
})
