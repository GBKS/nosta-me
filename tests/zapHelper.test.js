import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import { bytesToHex } from 'nostr-tools/utils'

const endpoint = vi.hoisted(() => ({ url: 'https://pay.example.com/callback?token=1' }))

vi.mock('nostr-tools/nip57', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, getZapEndpoint: vi.fn(async () => endpoint.url) }
})

import zapHelper, { zapSigner, failureMessage } from '@/helpers/zapHelper'
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
  zapper.listenForReceipt = vi.fn()
  return zapper.start(profileEvent, data).then(result => ({ zapper, result }))
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
    expect(zapRequest.tags).toContainEqual(['relays', 'wss://relay.example.com'])

    // Without a WebLN wallet nothing can pay the invoice yet.
    expect(result).toMatchObject({ status: 'error', id: 'no-webln' })
  })

  it('names relay addresses in the zap request, not relay ids', async () => {
    useRelayStore().relays['nos-social'] = { id: 'nos-social', url: 'wss://relay.nos.social' }
    data.relays = ['nos-social', 'unknown-relay']

    await zap()

    expect(sentZapRequest().tags).toContainEqual(['relays', 'wss://relay.nos.social'])
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

    const { zapper, result } = await zap()

    expect(window.webln.sendPayment).toHaveBeenCalledWith('lnbc210n1test')
    expect(zapper.listenForReceipt).toHaveBeenCalled()
    expect(result).toMatchObject({ status: 'success', id: 'payment-sent' })
  })

  it('says so when the payment fails', async () => {
    window.webln = { enable: vi.fn(async () => {}), sendPayment: vi.fn(async () => { throw new Error('nope') }) }

    const { result } = await zap()

    expect(result).toMatchObject({ status: 'error', id: 'webln-sendpayment-failed' })
  })
})
