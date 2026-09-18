import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import zapReceiptHelper from '@/helpers/zapReceiptHelper'
import { endpointForAddress, resultFromResponse, PROVIDER_STATUS } from '@/helpers/zapProviderService'

const SENDER_KEY = generateSecretKey()
const SENDER = getPublicKey(SENDER_KEY)
const PROVIDER_KEY = generateSecretKey()
const PROVIDER = getPublicKey(PROVIDER_KEY)
const RECIPIENT = 'b'.repeat(64)

// The example invoice from BOLT 11: 2500 micro-bitcoin, which is 250,000 sats.
const INVOICE = 'lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh'
const INVOICE_MILLISATS = 250000000

function zapRequest(changes = {}, key = SENDER_KEY) {
  return finalizeEvent({
    kind: 9734,
    created_at: 1700000000,
    content: 'Great post',
    tags: [['relays', 'wss://relay.example.com'], ['p', RECIPIENT]],
    ...changes
  }, key)
}

function zapReceipt(request, changes = {}) {
  const description = typeof request == 'string' ? request : JSON.stringify(request)

  return finalizeEvent({
    kind: 9735,
    created_at: 1700000100,
    content: '',
    tags: [['p', RECIPIENT], ['P', SENDER], ['bolt11', INVOICE], ['description', description]],
    ...changes
  }, PROVIDER_KEY)
}

describe('zapReceiptHelper.parse', () => {
  it('reads who zapped whom from the zap request, not from the author of the receipt', () => {
    const request = zapRequest()
    const receipt = zapReceipt(request)
    const zap = zapReceiptHelper.parse(receipt)

    expect(zap.sender).toBe(SENDER)
    expect(zap.recipient).toBe(RECIPIENT)
    expect(zap.provider).toBe(PROVIDER)
    expect(zap.comment).toBe('Great post')
    expect(zap.millisats).toBe(INVOICE_MILLISATS)
    expect(zap.sats).toBe(250000)
    expect(zap.id).toBe(receipt.id)
    expect(zap.requestId).toBe(request.id)
  })

  it('accepts a receipt without the optional "P" tag', () => {
    const request = zapRequest()
    const receipt = zapReceipt(request, {
      tags: [['p', RECIPIENT], ['bolt11', INVOICE], ['description', JSON.stringify(request)]]
    })

    expect(zapReceiptHelper.parse(receipt).sender).toBe(SENDER)
  })

  it('accepts a zap request with the matching amount', () => {
    const request = zapRequest({
      tags: [['p', RECIPIENT], ['amount', String(INVOICE_MILLISATS)]]
    })

    expect(zapReceiptHelper.parse(zapReceipt(request))).not.toBeNull()
  })

  it('rejects a zap request that was tampered with', () => {
    // Claims to come from someone else
    const forged = { ...zapRequest(), pubkey: 'c'.repeat(64) }
    expect(zapReceiptHelper.parse(zapReceipt(forged))).toBeNull()

    // A different comment than what was signed
    const edited = { ...zapRequest(), content: 'Send me money' }
    expect(zapReceiptHelper.parse(zapReceipt(edited))).toBeNull()

    // Not signed at all
    const { sig, ...unsigned } = zapRequest()
    expect(zapReceiptHelper.parse(zapReceipt(unsigned))).toBeNull()
  })

  it('rejects a receipt that names another recipient than the zap request', () => {
    const request = zapRequest()
    const receipt = zapReceipt(request, {
      tags: [['p', 'c'.repeat(64)], ['bolt11', INVOICE], ['description', JSON.stringify(request)]]
    })

    expect(zapReceiptHelper.parse(receipt)).toBeNull()
  })

  it('rejects a receipt that names another sender than the zap request', () => {
    const request = zapRequest()
    const receipt = zapReceipt(request, {
      tags: [['p', RECIPIENT], ['P', 'c'.repeat(64)], ['bolt11', INVOICE], ['description', JSON.stringify(request)]]
    })

    expect(zapReceiptHelper.parse(receipt)).toBeNull()
  })

  it('rejects an invoice for another amount than the sender asked for', () => {
    const request = zapRequest({ tags: [['p', RECIPIENT], ['amount', '21000']] })

    expect(zapReceiptHelper.parse(zapReceipt(request))).toBeNull()
  })

  it('rejects zap requests with no recipient or several', () => {
    const none = zapRequest({ tags: [['relays', 'wss://relay.example.com']] })
    const several = zapRequest({ tags: [['p', RECIPIENT], ['p', 'c'.repeat(64)]] })

    expect(zapReceiptHelper.parse(zapReceipt(none))).toBeNull()
    expect(zapReceiptHelper.parse(zapReceipt(several))).toBeNull()
  })

  it('rejects a description that is not a zap request', () => {
    const note = zapRequest({ kind: 1 })

    expect(zapReceiptHelper.parse(zapReceipt(note))).toBeNull()
    expect(zapReceiptHelper.parse(zapReceipt('not json'))).toBeNull()
    expect(zapReceiptHelper.parse(zapReceipt('null'))).toBeNull()
  })

  it('rejects receipts without a readable invoice or description', () => {
    const request = JSON.stringify(zapRequest())

    expect(zapReceiptHelper.parse(zapReceipt(request, { tags: [['p', RECIPIENT], ['description', request]] }))).toBeNull()
    expect(zapReceiptHelper.parse(zapReceipt(request, { tags: [['p', RECIPIENT], ['bolt11', 'lnbc-nonsense'], ['description', request]] }))).toBeNull()
    expect(zapReceiptHelper.parse(zapReceipt(request, { tags: [['p', RECIPIENT], ['bolt11', INVOICE]] }))).toBeNull()
  })

  it('copes with things that are not zap receipts', () => {
    expect(zapReceiptHelper.parse(null)).toBeNull()
    expect(zapReceiptHelper.parse({})).toBeNull()
    expect(zapReceiptHelper.parse({ kind: 9735 })).toBeNull()
    expect(zapReceiptHelper.parse(zapRequest())).toBeNull()
  })
})

describe('zapReceiptHelper.isFromProvider', () => {
  it('only accepts receipts signed by the lightning provider of the recipient', () => {
    const zap = zapReceiptHelper.parse(zapReceipt(zapRequest()))

    expect(zapReceiptHelper.isFromProvider(zap, PROVIDER)).toBe(true)
    expect(zapReceiptHelper.isFromProvider(zap, 'c'.repeat(64))).toBe(false)
    expect(zapReceiptHelper.isFromProvider(zap, null)).toBe(false)
    expect(zapReceiptHelper.isFromProvider(null, PROVIDER)).toBe(false)
  })
})

describe('zapReceiptHelper.isDuplicate', () => {
  it('counts a zap request once, even with several receipts for it', () => {
    const request = zapRequest()
    const first = zapReceiptHelper.parse(zapReceipt(request))
    const second = zapReceiptHelper.parse(zapReceipt(request, { created_at: 1700000200 }))
    const other = zapReceiptHelper.parse(zapReceipt(zapRequest({ content: 'Another one' })))

    expect(second.id).not.toBe(first.id)
    expect(zapReceiptHelper.isDuplicate(first, [first])).toBe(true)
    expect(zapReceiptHelper.isDuplicate(second, [first])).toBe(true)
    expect(zapReceiptHelper.isDuplicate(other, [first])).toBe(false)
    expect(zapReceiptHelper.isDuplicate(first, [])).toBe(false)
  })
})

describe('zapProviderService', () => {
  it('turns a lightning address into the LNURL pay endpoint', () => {
    expect(endpointForAddress('gbks@getalby.com')).toBe('https://getalby.com/.well-known/lnurlp/gbks')
    expect(endpointForAddress(' GBKS@GetAlby.com ')).toBe('https://getalby.com/.well-known/lnurlp/gbks')
  })

  it('refuses addresses that would turn into another kind of request', () => {
    expect(endpointForAddress(null)).toBeNull()
    expect(endpointForAddress('')).toBeNull()
    expect(endpointForAddress('no-at-sign')).toBeNull()
    expect(endpointForAddress('a@b@c.com')).toBeNull()
    expect(endpointForAddress('../../api/secret@example.com')).toBeNull()
    expect(endpointForAddress('name@example.com/other/path')).toBeNull()
    expect(endpointForAddress('name@user:pass@example.com')).toBeNull()
    expect(endpointForAddress('name@example.com?x=1')).toBeNull()
    expect(endpointForAddress('name?x=1@example.com')).toBeNull()
  })

  it('reads the key the provider signs receipts with', () => {
    expect(resultFromResponse({ allowsNostr: true, nostrPubkey: PROVIDER })).toEqual({ status: PROVIDER_STATUS.FOUND, publicKey: PROVIDER })
    expect(resultFromResponse({ callback: 'https://example.com' })).toEqual({ status: PROVIDER_STATUS.NONE })
    expect(resultFromResponse({ allowsNostr: false, nostrPubkey: PROVIDER })).toEqual({ status: PROVIDER_STATUS.NONE })
    expect(resultFromResponse({ allowsNostr: true, nostrPubkey: 'npub1nothex' })).toEqual({ status: PROVIDER_STATUS.NONE })
    expect(resultFromResponse(null)).toEqual({ status: PROVIDER_STATUS.UNKNOWN })
  })
})
