import { describe, it, expect, vi } from 'vitest'
import profileService from '@/helpers/profileService.js'

const ALICE = 'a'.repeat(64)
const BOB = 'b'.repeat(64)

describe('profileService', () => {
  it('only passes on events about the profile that is open', () => {
    const callback = vi.fn()
    profileService.publicKey = ALICE
    profileService.findCallback = callback

    // Created by the profile
    profileService.onEvent({ id: '1', kind: 0, pubkey: ALICE, tags: [], content: '{}' })
    // Sent to the profile, like a zap receipt
    profileService.onEvent({ id: '2', kind: 9735, pubkey: BOB, tags: [['p', ALICE]], content: '' })
    // Sent by the profile, a zap receipt names the sender in the "P" tag
    profileService.onEvent({ id: '5', kind: 9735, pubkey: BOB, tags: [['p', BOB], ['P', ALICE]], content: '' })
    // Not an event
    profileService.onEvent({ type: 'end' })
    expect(callback).toHaveBeenCalledTimes(4)

    // From a request for someone else, arriving late
    profileService.onEvent({ id: '3', kind: 0, pubkey: BOB, tags: [], content: '{}' })
    profileService.onEvent({ id: '4', kind: 9735, pubkey: BOB, tags: [['p', BOB]], content: '' })
    expect(callback).toHaveBeenCalledTimes(4)
  })
})
