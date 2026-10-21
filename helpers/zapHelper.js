import browserHelper from '@/helpers/browserHelper.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import ToolBox from '@/helpers/toolBox'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { useRelayStore } from '@/stores/relays'
import { getZapEndpoint, makeZapRequest } from 'nostr-tools/nip57'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'

/*

Handles zapping logic for the zap modal.

A zap goes: find the zap endpoint from the lightning address, sign a zap
request, get an invoice for it, pay that with WebLN. Each way this can fail has
its own id, which the modal turns into a message (failureMessage) and counts in
analytics. The analytics dashboard is public, so ids must stay categorical.

 */

const FAILURE_MESSAGES = {
  'get-zap-endpoint-failed': "Their lightning address can't receive zaps right now.",
  'cannot-sign': "There's no way to sign this zap. Is your Nostr extension turned on?",
  'sign-rejected': 'The zap was not signed, so nothing was sent.',
  'fetch-invoice-failed': "Their wallet provider didn't send an invoice. Please try again.",
  'invoice-error': "Their wallet provider didn't send an invoice.",
  'no-webln': 'No lightning wallet was found in this browser, so nothing was sent.',
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

// The app knows relays by id, the zap request needs their addresses. This is
// where the wallet provider publishes the zap receipt.
function relayUrls(relays) {
  const relayStore = useRelayStore()

  return (relays || []).map(relay => {
    if(typeof relay == 'string' && relay.indexOf('wss://') === 0) return relay

    const known = relayStore.getRelay(relay)
    return known ? known.url : null
  }).filter(Boolean)
}

function failure(id, details) {
  return { status: 'error', id, ...details }
}

export default function zapHelper () { 
  return {
    log: !false,
    zapData: null,
    invoice: null,
    result: null,
    receiptAttempts: null,
    receiptTimer: null,

    async start(profileEvent, data) {
      this.zapData = data
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

        const invoice = await this.fetchInvoice(zapEndpoint, data.amount, data.comment, signed.event)
        if(invoice.error) return failure(invoice.error, { reason: invoice.reason })

        // Could show the invoice as a QR code instead.
        if(!browserHelper.isWebLNAvailable()) return failure('no-webln')

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

          this.listenForReceipt(paymentResult)

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

    // Never getting any receipts in testing currently - something wrong?
    listenForReceipt(paymentResult) {
      this.receiptAttempts = 0

      this.receiptTimer = setInterval(() => { this.startReceiptListener() }, 5000)
    },

    startReceiptListener() {
      this.receiptAttempts++

      if(this.log) console.log('ZapHelper.startReceiptListener', this.receiptAttempts, this.zapData)
      
      if(this.receiptAttempts > 10) {
        clearInterval(this.receiptTimer)
      } else {
        const request = multiRelayRequest()
        request.init(this.onReceipt)
        request.start(
          this.zapData.relays, 
          [{ kinds: [9735], since: Math.round(Date.now() / 1000 - 10) }]
        )
      }
    },

    onReceipt(event) {
      if(this.log) console.log('ZapHelper.onReceipt', event, this.invoice)

      if(event.tags.find((t) => t[0] === "bolt11" && t[1] === this.invoice.pr)) {
      }
    }
  }
}