import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import { bytesToHex } from 'nostr-tools/utils'

const endpoint = vi.hoisted(() => ({ url: 'https://pay.example.com/callback?token=1' }))

vi.mock('nostr-tools/nip57', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, getZapEndpoint: vi.fn(async () => endpoint.url) }
})

// Every receipt request the listener makes, answered by hand.
const requests = vi.hoisted(() => [])

vi.mock('@/helpers/multiRelayRequest.js', () => ({
  default: () => {
    const request = {
      killed: false,
      init(callback) { this.callback = callback },
      start(relayIds, filters) { this.relayIds = relayIds; this.filters = filters },
      kill() { this.killed = true }
    }
    requests.push(request)
    return request
  }
}))

vi.mock('@/helpers/relayManager.js', () => ({
  default: { addRelayByUrl: (url) => 'id:' + url }
}))

import zapHelper, { zapSigner, failureMessage, isReceiptFor, RECEIPT_RELAYS } from '@/helpers/zapHelper'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { useRelayStore } from '@/stores/relays'

const RECIPIENT = getPublicKey(generateSecretKey())

const profileEvent = {
  kind: 0,
  pubkey: RECIPIENT,
  content: { lud16: 'someone@example.com' },
  relay: 'wss://relay.example.com'
}

const data = {
  amount: 21000,
  comment: null,
  authorId: RECIPIENT,
  noteId: null,
  relays: ['wss://relay.example.com', undefined]
}

let invoiceResponse

function zap() {
  const zapper = zapHelper()
  return zapper.start(profileEvent, data).then(result => ({ zapper, result }))
}

function relaysTag() {
  return sentZapRequest().tags.find(tag => tag[0] == 'relays')
}

function receipt(bolt11) {
  return { kind: 9735, tags: [['p', RECIPIENT], ['bolt11', bolt11]] }
}

function requestedUrl() {
  return new URL(fetch.mock.calls[0][0])
}

function sentZapRequest() {
  return JSON.parse(requestedUrl().searchParams.get('nostr'))
}

describe('zapSigner', () => {
  it('signs with the stored key after a private key login', () => {
    expect(zapSigner({ isLoggedIn: true, loginType: LOGIN_TYPE.PRIVATE_KEY, privateKey: 'abc', hasExtension: true })).toBe('private-key')
  })

  it('uses the extension after an extension login', () => {
    expect(zapSigner({ isLoggedIn: true, loginType: LOGIN_TYPE.BROWSER, privateKey: null, hasExtension: true })).toBe('extension')
  })

  it('has no way to sign when the extension of a logged-in user is gone', () => {
    expect(zapSigner({ isLoggedIn: true, loginType: LOGIN_TYPE.BROWSER, privateKey: null, hasExtension: false })).toBe('none')
    expect(zapSigner({ isLoggedIn: true, loginType: LOGIN_TYPE.PRIVATE_KEY, privateKey: null, hasExtension: false })).toBe('none')
  })

  it('uses an extension when not logged in, and zaps anonymously without one', () => {
    expect(zapSigner({ isLoggedIn: false, loginType: null, privateKey: null, hasExtension: true })).toBe('extension')
    expect(zapSigner({ isLoggedIn: false, loginType: null, privateKey: null, hasExtension: false })).toBe('anonymous')
  })
})

describe('failureMessage', () => {
  it('passes on what the wallet provider said', () => {
    expect(failureMessage({ id: 'invoice-error', reason: 'Amount too small' })).toBe('Their wallet provider said: Amount too small')
  })

  it('has a message for ids it does not know', () => {
    expect(failureMessage({ id: 'something-new' })).toBe('Something went wrong, so nothing was sent.')
  })
})

describe('zapHelper.start', () => {
  beforeEach(() => {
    const session = useSessionStore()
    session.isLoggedIn = false
    session.loginType = null
    session.privateKey = null

    delete window.nostr
    delete window.webln

    invoiceResponse = { pr: 'lnbc210n1test' }
    globalThis.fetch = vi.fn(async () => ({ json: async () => invoiceResponse }))
    endpoint.url = 'https://pay.example.com/callback?token=1'
  })

  afterEach(() => {
    delete window.nostr
    delete window.webln
  })

  it('zaps anonymously with a throwaway key when not logged in', async () => {
    const { result } = await zap()

    const zapRequest = sentZapRequest()
    expect(zapRequest.kind).toBe(9734)
    expect(verifyEvent(zapRequest)).toBe(true)
    expect(zapRequest.pubkey).not.toBe(RECIPIENT)
  })

  it('returns the invoice to show when there is no WebLN', async () => {
    const { result } = await zap()

    expect(result).toMatchObject({ status: 'invoice', id: 'invoice-shown', pr: 'lnbc210n1test' })
  })

  it('asks for the receipt on the profile relay and the big relays', async () => {
    await zap()

    expect(relaysTag()).toEqual(['relays', 'wss://relay.example.com', ...RECEIPT_RELAYS])
  })

  it('names relay addresses in the zap request, not relay ids', async () => {
    useRelayStore().relays['nos-social'] = { id: 'nos-social', url: 'wss://relay.nos.social' }
    data.relays = ['nos-social', 'unknown-relay']

    await zap()

    expect(relaysTag()).toEqual(['relays', 'wss://relay.nos.social', ...RECEIPT_RELAYS])
    data.relays = ['wss://relay.example.com', undefined]
  })

  it('keeps the query string of the callback', async () => {
    await zap()

    expect(requestedUrl().searchParams.get('token')).toBe('1')
    expect(requestedUrl().searchParams.get('amount')).toBe('21000')
  })

  it('signs with the stored key after a private key login', async () => {
    const key = generateSecretKey()
    const session = useSessionStore()
    session.isLoggedIn = true
    session.loginType = LOGIN_TYPE.PRIVATE_KEY
    session.privateKey = bytesToHex(key)

    await zap()

    expect(sentZapRequest().pubkey).toBe(getPublicKey(key))
    expect(verifyEvent(sentZapRequest())).toBe(true)
  })

  it('says so when the extension does not sign', async () => {
    window.nostr = { signEvent: vi.fn(async () => { throw new Error('rejected') }) }

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'sign-rejected' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('says so when a logged-in user has no way to sign', async () => {
    const session = useSessionStore()
    session.isLoggedIn = true
    session.loginType = LOGIN_TYPE.BROWSER

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'cannot-sign' })
  })

  it('stops when the lightning address has no zap endpoint', async () => {
    endpoint.url = null

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'get-zap-endpoint-failed' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('passes on the reason when the provider refuses the invoice', async () => {
    invoiceResponse = { status: 'ERROR', reason: 'Amount too small' }

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'invoice-error', reason: 'Amount too small' })
  })

  it('fails when the invoice request fails', async () => {
    fetch.mockImplementation(async () => { throw new TypeError('Failed to fetch') })

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'fetch-invoice-failed' })
  })

  it('pays the invoice with WebLN', async () => {
    window.webln = { enable: vi.fn(async () => {}), sendPayment: vi.fn(async () => ({ preimage: 'abc' })) }

    const { result } = await zap()

    expect(window.webln.sendPayment).toHaveBeenCalledWith('lnbc210n1test')
    expect(result).toMatchObject({ status: 'success', id: 'payment-sent' })
  })

  it('says so when the payment fails', async () => {
    window.webln = { enable: vi.fn(async () => {}), sendPayment: vi.fn(async () => { throw new Error('nope') }) }

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'webln-sendpayment-failed' })
  })
})

describe('isReceiptFor', () => {
  it('matches the receipt for the invoice, in any case', () => {
    expect(isReceiptFor(receipt('lnbc210n1test'), 'lnbc210n1test')).toBe(true)
    expect(isReceiptFor(receipt('LNBC210N1TEST'), 'lnbc210n1test')).toBe(true)
  })

  it('ignores receipts for other invoices and other kinds', () => {
    expect(isReceiptFor(receipt('lnbc1other'), 'lnbc210n1test')).toBe(false)
    expect(isReceiptFor({ ...receipt('lnbc210n1test'), kind: 1 }, 'lnbc210n1test')).toBe(false)
    expect(isReceiptFor(null, 'lnbc210n1test')).toBe(false)
  })
})

describe('zapHelper.listenForReceipt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    requests.length = 0

    const session = useSessionStore()
    session.isLoggedIn = false
    delete window.nostr
    delete window.webln

    invoiceResponse = { pr: 'lnbc210n1test' }
    globalThis.fetch = vi.fn(async () => ({ json: async () => invoiceResponse }))
    endpoint.url = 'https://pay.example.com/callback'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks the zap request relays for receipts to the recipient', async () => {
    const { zapper } = await zap()
    zapper.listenForReceipt(vi.fn())

    const request = requests[0]
    expect(request.relayIds).toEqual(['wss://relay.example.com', ...RECEIPT_RELAYS].map(url => 'id:' + url))
    expect(request.filters[0]).toMatchObject({ kinds: [9735], '#p': [RECIPIENT] })
    expect(request.filters[0].since).toBeLessThan(zapper.zapRequest.created_at)

    zapper.stopListening()
  })

  it('asks again until the receipt shows up, then stops', async () => {
    const { zapper } = await zap()
    const onPaid = vi.fn()
    zapper.listenForReceipt(onPaid)

    requests[0].callback(receipt('lnbc1other'))
    expect(onPaid).not.toHaveBeenCalled()

    vi.advanceTimersByTime(5000)
    expect(requests.length).toBe(2)
    expect(requests[0].killed).toBe(true)

    const paid = receipt('lnbc210n1test')
    requests[1].callback(paid)
    expect(onPaid).toHaveBeenCalledWith(paid)
    expect(requests[1].killed).toBe(true)

    vi.advanceTimersByTime(60000)
    expect(requests.length).toBe(2)
  })

  it('gives up when the invoice could have expired', async () => {
    const { zapper } = await zap()
    const onGiveUp = vi.fn()
    zapper.listenForReceipt(vi.fn(), onGiveUp)

    vi.advanceTimersByTime(15 * 60 * 1000)

    expect(onGiveUp).toHaveBeenCalled()
    const count = requests.length
    vi.advanceTimersByTime(60000)
    expect(requests.length).toBe(count)
  })

  it('stops when the modal closes', async () => {
    const { zapper } = await zap()
    zapper.listenForReceipt(vi.fn())
    zapper.stopListening()

    vi.advanceTimersByTime(60000)

    expect(requests.length).toBe(1)
    expect(requests[0].killed).toBe(true)
  })
})
