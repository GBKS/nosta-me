import { describe, it, expect } from 'vitest'
import { bytesToHex } from 'nostr-tools/utils'
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure'
import ToolBox from '@/helpers/toolBox'

// From the NIP-06 test vectors.
const PRIVATE_KEY = '7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a'
const PUBLIC_KEY = '17162c921dc4d2518f9a101db33695df1afb56ab82f5ff3e5da6eec3ca5cd917'

describe('ToolBox.formatPrice', () => {
  // Number formatting depends on the locale, so separators are matched loosely.

  it('formats sats, which is not an ISO currency and used to throw', () => {
    expect(ToolBox.formatPrice('1000', 'sats')).toMatch(/^1.?000 sats$/)
    expect(ToolBox.formatPrice('1500000', 'SAT')).toMatch(/^1.?500.?000 sats$/)
  })

  it('keeps small bitcoin amounts instead of rounding them to zero', () => {
    expect(ToolBox.formatPrice('0.00021', 'BTC')).toMatch(/^0.00021 BTC$/)
  })

  it('formats ISO currencies, in any case', () => {
    expect(ToolBox.formatPrice('25', 'USD')).toMatch(/25/)
    expect(ToolBox.formatPrice('25', 'USD')).not.toBe('25 USD')
    expect(ToolBox.formatPrice('99.5', 'eur')).toMatch(/99.50?/)
  })

  it('does not throw without a currency or with nonsense', () => {
    expect(ToolBox.formatPrice('12', null)).toBe('12')
    expect(ToolBox.formatPrice('12', undefined)).toBe('12')
    expect(ToolBox.formatPrice('5', 'not-a-currency')).toBe('5 not-a-currency')
    expect(ToolBox.formatPrice('abc', 'sats')).toBe('abc sats')
  })
})

describe('ToolBox.privateKeyToBytes', () => {
  const signsAsExpected = (key) => {
    const event = finalizeEvent({ kind: 1, created_at: 1, tags: [], content: 'test' }, ToolBox.privateKeyToBytes(key))
    return verifyEvent(event) && event.pubkey === PUBLIC_KEY
  }

  it('converts the hex string we store', () => {
    const bytes = ToolBox.privateKeyToBytes(PRIVATE_KEY)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytesToHex(bytes)).toBe(PRIVATE_KEY)
    expect(signsAsExpected(PRIVATE_KEY)).toBe(true)
  })

  it('reads the comma-separated format older logins left in local storage', () => {
    const legacy = String(ToolBox.privateKeyToBytes(PRIVATE_KEY))
    expect(legacy).toContain(',')
    expect(signsAsExpected(legacy)).toBe(true)
  })

  it('passes bytes through', () => {
    const bytes = ToolBox.privateKeyToBytes(PRIVATE_KEY)
    expect(ToolBox.privateKeyToBytes(bytes)).toBe(bytes)
  })
})

describe('ToolBox.trim', () => {
  it('leaves short text alone', () => {
    expect(ToolBox.trim('short', 25)).toBe('short')
  })

  it('cuts the middle by default and the end on request', () => {
    const text = 'www.nytimes.com/2026/09/08/opinion/some-long-article.html'
    expect(ToolBox.trim(text, 25)).toBe('www.nytimes...rticle.html')
    expect(ToolBox.trim(text, 25, 'end')).toBe('www.nytimes.com/2026/09...')
  })

  it('handles missing text', () => {
    expect(ToolBox.trim(null, 25)).toBe(null)
  })
})

describe('ToolBox.migrateDeprecatedProfileFields', () => {
  it('removes the deprecated fields and leaves the rest alone', () => {
    const content = { name: 'alice', display_name: 'Alice', displayName: 'Old Alice', username: 'old-alice', about: 'Hi', bot: true }

    expect(ToolBox.migrateDeprecatedProfileFields(content)).toEqual({ name: 'alice', display_name: 'Alice', about: 'Hi', bot: true })
  })

  it('moves a value over when the field that replaced it is empty', () => {
    expect(ToolBox.migrateDeprecatedProfileFields({ displayName: 'Alice', username: 'alice' })).toEqual({ display_name: 'Alice', name: 'alice' })
    expect(ToolBox.migrateDeprecatedProfileFields({ name: '', username: 'alice' })).toEqual({ name: 'alice' })
  })

  it('does not move values that are not text', () => {
    expect(ToolBox.migrateDeprecatedProfileFields({ displayName: { a: 1 }, username: '' })).toEqual({})
  })

  it('does nothing to a profile without them', () => {
    expect(ToolBox.migrateDeprecatedProfileFields({ name: 'alice' })).toEqual({ name: 'alice' })
  })
})

describe('ToolBox.formatNostrAddress', () => {
  it('shows an address for the domain itself as just the domain', () => {
    expect(ToolBox.formatNostrAddress('_@bob.com')).toBe('bob.com')
    expect(ToolBox.formatNostrAddress(' _@bob.com ')).toBe('bob.com')
  })

  it('leaves other addresses alone', () => {
    expect(ToolBox.formatNostrAddress('bob@bob.com')).toBe('bob@bob.com')
    expect(ToolBox.formatNostrAddress('_bob@bob.com')).toBe('_bob@bob.com')
    expect(ToolBox.formatNostrAddress('bob_@bob.com')).toBe('bob_@bob.com')
    expect(ToolBox.formatNostrAddress('_@')).toBe('_@')
  })

  it('copes with a missing address', () => {
    expect(ToolBox.formatNostrAddress(undefined)).toBe('')
    expect(ToolBox.formatNostrAddress({})).toBe('')
  })
})

describe('ToolBox.isBot', () => {
  it('is true for accounts that say they are automated', () => {
    expect(ToolBox.isBot({ bot: true })).toBe(true)
    expect(ToolBox.isBot({ bot: 'true' })).toBe(true)
  })

  it('is false for everything else', () => {
    for(const bot of [false, 'false', undefined, null, 0, 1, 'yes', {}, []]) {
      expect(ToolBox.isBot({ bot }), String(bot)).toBe(false)
    }

    expect(ToolBox.isBot({})).toBe(false)
    expect(ToolBox.isBot(null)).toBe(false)
  })
})
