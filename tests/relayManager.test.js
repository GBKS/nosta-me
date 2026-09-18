import { describe, it, expect, vi, beforeEach } from 'vitest'

// No real connections in tests.
vi.mock('@/helpers/relayConnector.js', () => {
  return {
    default: () => ({
      connection: null,
      init: vi.fn(),
      disconnect: vi.fn(),
      reconnectIfNeeded: vi.fn(),
      checkStatus: vi.fn(),
      isConnected: () => false
    })
  }
})

import relayManager from '@/helpers/relayManager.js'
import relayList from '@/helpers/relayList.js'
import { useRelayStore } from '@/stores/relays.js'

describe('relayManager', () => {
  beforeEach(() => {
    relayManager.init()
  })

  it('starts with every primary relay plus three others', () => {
    const ids = relayManager.getAllRelayIds()
    const primaryIds = Object.keys(relayList).filter(id => relayList[id].primary)

    expect(primaryIds.length).toBeGreaterThan(0)
    for(const id of primaryIds) {
      expect(ids).toContain(id)
    }
    expect(ids.length).toBe(primaryIds.length + 3)
  })

  it('sees the same relay regardless of trailing slash, case or whitespace', () => {
    const id = relayManager.addRelayByUrl('wss://relay.example.com')

    expect(id).toBe('relay-example-com')
    expect(relayManager.addRelayByUrl('wss://relay.example.com/')).toBe(id)
    expect(relayManager.addRelayByUrl('WSS://Relay.Example.com')).toBe(id)
    expect(relayManager.addRelayByUrl(' wss://relay.example.com ')).toBe(id)

    expect(relayManager.isAdded('wss://relay.example.com/')).toBe(true)
    expect(relayManager.isAdded('wss://other.example.com')).toBe(false)
  })

  it('does not put a trailing slash into relay ids', () => {
    expect(relayManager.addRelayByUrl('wss://slash.example.com/')).toBe('slash-example-com')
  })

  it('finds seed relays by URL instead of adding them twice', () => {
    expect(relayManager.addRelayByUrl('wss://nos.lol/')).toBe('nos-lol')
  })

  it('ignores missing URLs', () => {
    expect(relayManager.addRelayByUrl(null)).toBeUndefined()
    expect(relayManager.addRelayByUrl('')).toBeUndefined()
  })

  it('removes a relay and disconnects it', () => {
    const id = relayManager.addRelayByUrl('wss://remove-me.example.com')
    const connector = relayManager.getConnector(id)
    const relayStore = useRelayStore()

    expect(relayStore.getRelay(id)).toBeTruthy()

    relayManager.removeRelay('wss://remove-me.example.com/')

    expect(connector.disconnect).toHaveBeenCalled()
    expect(relayManager.getConnector(id)).toBeUndefined()
    expect(relayStore.getRelay(id)).toBeUndefined()
  })
})
