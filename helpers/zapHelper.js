import browserHelper from '@/helpers/browserHelper.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayManager from '@/helpers/relayManager.js'
import ToolBox from '@/helpers/toolBox'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { useRelayStore } from '@/stores/relays'
import { getZapEndpoint, makeZapRequest } from 'nostr-tools/nip57'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import bolt11Decoder from 'light-bolt11-decoder'

/*

Handles zapping logic for the zap modal.

A zap goes: find the zap endpoint from the lightning address, sign a zap
request, get an invoice for it, pay that with WebLN. Without WebLN the modal
shows the invoice to pay with any wallet, and waits for the zap receipt that
the recipient's provider publishes once it is paid. Each way this can fail has
its own id, which the modal turns into a message (failureMessage) and counts in
analytics. The analytics dashboard is public, so ids must stay categorical.

 */

const FAILURE_MESSAGES = {
  'get-zap-endpoint-failed': "Their lightning address can't receive zaps right now.",
  'cannot-sign': "There's no way to sign this zap. Is your Nostr extension turned on?",
  'sign-rejected': 'The zap was not signed, so nothing was sent.',
  'fetch-invoice-failed': "Their wallet provider didn't send an invoice. Please try again.",
  'invoice-error': "Their wallet provider didn't send an invoice.",
  'enable-webln-failed': "Your lightning wallet didn't connect, so nothing was sent.",
  'webln-sendpayment-failed': "The payment didn't go through.",
  'unknown': 'Something went wrong, so nothing was sent.'
}

// Who signs the zap request. Someone logged in signs as themselves. Someone
// who isn't and has no extension zaps anonymously with a throwaway key, which
// NIP-57 allows.
export function zapSigner({ isLoggedIn, loginType, privateKey, hasExtension }) {
  if(isLoggedIn && loginType == LOGIN_TYPE.PRIVATE_KEY) {
    return privateKey ? 'private-key' : 'none'
  }

  if(hasExtension) return 'extension'

  return isLoggedIn ? 'none' : 'anonymous'
}

export function sessionZapSigner() {
  const session = useSessionStore()

  return zapSigner({
    isLoggedIn: session.isLoggedIn,
    loginType: session.loginType,
    privateKey: session.privateKey,
    hasExtension: browserHelper.isNostrAvailable()
  })
}

export function failureMessage(result) {
  if(result.id == 'invoice-error' && result.reason) {
    return 'Their wallet provider said: ' + result.reason
  }

  return FAILURE_MESSAGES[result.id] || FAILURE_MESSAGES.unknown
}

// Where the provider publishes the zap receipt, and so where we look for it.
// The relay the profile came from, plus big relays most clients read from.
export const RECEIPT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
]

// Polling, because a relay request ends once the relay has sent what it has.
const RECEIPT_CHECK_INTERVAL = 5000
const RECEIPT_MAX_WAIT = 15 * 60 * 1000

// The app knows relays by id, the zap request needs their addresses.
function relayUrls(relays) {
  const relayStore = useRelayStore()
  const result = []

  for(const relay of (relays || []).concat(RECEIPT_RELAYS)) {
    let url = null

    if(typeof relay == 'string' && relay.indexOf('wss://') === 0) {
      url = relay
    } else {
      const known = relayStore.getRelay(relay)
      url = known ? known.url : null
    }

    if(url && result.indexOf(url) === -1) {
      result.push(url)
    }
  }

  return result
}

// How long an invoice can be paid, in milliseconds. BOLT11 says one hour
// when the invoice doesn't say.
function invoiceLifetime(pr) {
  try {
    const expiry = bolt11Decoder.decode(pr).expiry
    return (expiry > 0 ? expiry : 3600) * 1000
  } catch(error) {
    return 3600 * 1000
  }
}

// The receipt for our invoice. Only we and the provider know the invoice.
export function isReceiptFor(receipt, pr) {
  if(!receipt || receipt.kind != 9735 || !Array.isArray(receipt.tags)) return false

  return receipt.tags.some(tag => tag[0] == 'bolt11' && typeof tag[1] == 'string' && tag[1].toLowerCase() == pr.toLowerCase())
}

function failure(id, details) {
  return { status: 'error', id, ...details }
}

export default function zapHelper () { 
  return {
    log: false,
    zapData: null,
    zapRequest: null,
    invoice: null,
    result: null,
    receiptRequest: null,
    receiptTimer: null,
    receiptTimeout: null,

    async start(profileEvent, data) {
      this.zapData = data
      this.zapRequest = null
      this.invoice = null

      this.result = await this.zap(profileEvent, data)

      if(this.invoice && !this.result.invoice) {
        this.result.invoice = this.invoice
      }

      return this.result
    },

    async zap(profileEvent, data) {
      try {
        // Vue gives us a proxy event.
        const rawEvent = { ...toRaw(profileEvent) }
        rawEvent.content = JSON.stringify(rawEvent.content)

        const zapEndpoint = await getZapEndpoint(rawEvent)
        if(!zapEndpoint) return failure('get-zap-endpoint-failed')

        const signed = await this.signZapRequest(this.makeZapRequest(data))
        if(signed.error) return failure(signed.error)

        this.zapRequest = signed.event

        const invoice = await this.fetchInvoice(zapEndpoint, data.amount, data.comment, signed.event)
        if(invoice.error) return failure(invoice.error, { reason: invoice.reason })

        // Any wallet can pay it, the modal waits for the receipt.
        if(!browserHelper.isWebLNAvailable()) {
          return {
            status: 'invoice',
            id: 'invoice-shown',
            pr: invoice.pr
          }
        }

        try {
          await window.webln.enable()
        } catch(error) {
          return failure('enable-webln-failed', { error })
        }

        try {
          /*
          paymentResult = {
            paymentHash: '',
            preimage: '',
            route: {
              total_amt: 100, // Sats
              total_fees: 0
            }
          }
           */
          const paymentResult = await window.webln.sendPayment(invoice.pr)

          return {
            status: 'success',
            id: 'payment-sent',
            data: paymentResult
          }
        } catch(error) {
          return failure('webln-sendpayment-failed', { error })
        }
      } catch(error) {
        return failure('unknown', { error })
      }
    },

    makeZapRequest(data) {
      const zapRequest = makeZapRequest({
        pubkey: data.authorId,
        amount: data.amount,
        relays: relayUrls(data.relays),
        comment: data.comment || ''
      })

      // makeZapRequest only takes full events now, we just have the id.
      if(data.noteId) {
        zapRequest.tags.push(['e', nip19.decode(data.noteId).data])
      }

      return zapRequest
    },

    // { event } when signed, { error } when not, see zapSigner.
    async signZapRequest(zapRequest) {
      switch(sessionZapSigner()) {
        case 'private-key':
          return { event: finalizeEvent(zapRequest, ToolBox.privateKeyToBytes(useSessionStore().privateKey)) }
        case 'anonymous':
          return { event: finalizeEvent(zapRequest, generateSecretKey()) }
        case 'extension': {
          const event = await browserHelper.signNostrEvent(zapRequest)
          return event ? { event } : { error: 'sign-rejected' }
        }
      }

      return { error: 'cannot-sign' }
    },

    // { pr } with the invoice, or { error, reason }.
    async fetchInvoice(zapEndpoint, amount, comment, zapRequest) {
      // Some callbacks already have a query string.
      const url = new URL(zapEndpoint)
      url.searchParams.set('amount', amount)
      url.searchParams.set('nostr', JSON.stringify(zapRequest))

      if(comment) {
        url.searchParams.set('comment', comment)
      }

      let resultData
      try {
        const result = await fetch(url.toString())
        resultData = await result.json()
      } catch(error) {
        return { error: 'fetch-invoice-failed' }
      }

      this.invoice = resultData

      // LNURL errors come as { status: 'ERROR', reason }, like an amount that is too small.
      if(resultData.status == 'ERROR') {
        return { error: 'invoice-error', reason: resultData.reason }
      }

      if(!resultData.pr) {
        return { error: 'fetch-invoice-failed' }
      }

      return { pr: resultData.pr }
    },

    // Calls onPaid(receipt) once the receipt for the invoice shows up, or
    // onGiveUp() when the invoice has expired without one.
    listenForReceipt(onPaid, onGiveUp) {
      this.stopListening()

      const pr = this.invoice && this.invoice.pr
      if(!pr || !this.zapRequest) return

      const relayIds = relayUrls(this.zapData.relays).map(url => relayManager.addRelayByUrl(url)).filter(Boolean)
      const filters = [{
        kinds: [9735],
        '#p': [this.zapData.authorId],
        // Leeway for clocks that are a bit off.
        since: this.zapRequest.created_at - 60
      }]

      const check = () => {
        if(this.receiptRequest) this.receiptRequest.kill()

        this.receiptRequest = multiRelayRequest()
        this.receiptRequest.init((event) => {
          if(isReceiptFor(event, pr)) {
            if(this.log) console.log('ZapHelper.receipt', event)

            this.stopListening()
            onPaid(event)
          }
        })
        this.receiptRequest.start(relayIds, filters)
      }

      check()
      this.receiptTimer = setInterval(check, RECEIPT_CHECK_INTERVAL)
      this.receiptTimeout = setTimeout(() => {
        this.stopListening()
        if(onGiveUp) onGiveUp()
      }, Math.min(invoiceLifetime(pr), RECEIPT_MAX_WAIT))
    },

    stopListening() {
      clearInterval(this.receiptTimer)
      clearTimeout(this.receiptTimeout)
      this.receiptTimer = null
      this.receiptTimeout = null

      if(this.receiptRequest) {
        this.receiptRequest.kill()
        this.receiptRequest = null
      }
    }
  }
}
