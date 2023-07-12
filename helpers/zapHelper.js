import browserHelper from '@/helpers/browserHelper.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'

/*

Handles zapping logic for the zap modal.
Pretty bad code at the moment.

 */

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
      this.result = {}
      this.invoice = null

      try {
        // Vue gives us a proxy event.
        const rawEvent = { ...toRaw(profileEvent) }
        rawEvent.content = JSON.stringify(rawEvent.content)

        // Fetch the zap endpoint.
        const zapEndpoint = await window.NostrTools.nip57.getZapEndpoint(rawEvent)

        // We need to fetch an invoice.
        if(zapEndpoint) {
          const invoice = await this.fetchInvoice(
            zapEndpoint,
            data.amount,
            data.comment,
            data.authorId,
            data.noteId,
            data.relays
          )

          if(invoice) {
            // Possibly centralized webln checking/enabling
            if (window.webln) { // TODO: Move this check much earlier - webln is already being used up there.
              try {
                await window.webln.enable()

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
                try {
                  const paymentResult = await window.webln.sendPayment(invoice)

                  this.listenForReceipt(paymentResult)

                  this.result = {
                    status: 'success',
                    id: 'payment-sent',
                    data: paymentResult
                  }
                } catch(error) {
                  this.result = {
                    status: 'error',
                    id: 'webln-sendpayment-failed',
                    error
                  }
                }
              } catch (error) {
                // Could not enable webln
                // Could show invoice as QR
                this.result = {
                  status: 'error',
                  id: 'enable-webln-failed',
                  error
                }
              }
            } else {
              // Webln not available
              // Could show invoice as QR
            }
          } else {
            this.result = {
              status: 'error',
              id: 'fetch-invoice-failed',
              zapEndpoint,
              invoice
            }
          }
        } else {
          this.result = {
            status: 'error',
            id: 'get-zap-endpoint-failed',
            event: rawEvent
          }
        }
      } catch(error) {
        this.result = {
          status: 'error',
          error
        }
      }

      if(this.invoice && !this.result.invoice) {
        this.result.invoice = this.invoice
      }

      return this.result
    },

    async fetchInvoice(zapEndpoint, amount, comment, authorId, noteId, relays) {
      const zapEvent = await this.makeZapEvent(
        authorId,
        noteId ? window.NostrTools.nip19.decode(noteId).data : undefined,
        amount,
        relays,
        comment || '',
      )

      if(zapEvent) {
        let url = `${zapEndpoint}?amount=${amount}&nostr=${encodeURIComponent(
          JSON.stringify(zapEvent)
        )}`

        if(comment) {
          url = `${url}&comment=${encodeURIComponent(comment)}`
        }

        const result = await fetch(url)
        const resultData = await result.json()

        this.invoice = resultData

        return resultData.pr
      } else {
        return null
      }
    },

    async makeZapEvent(profile, event, amount, relays, comment) {
      try {
        const zapEvent = window.NostrTools.nip57.makeZapRequest({
          profile,
          event,
          amount,
          relays,
          comment,
        })

        if(zapEvent) {
          const result = await browserHelper.signNostrEvent(zapEvent)

          if(result) {
            return result
          } else {
            this.result = {
              status: 'error',
              id: 'nostr-signevent-failed',
              error: error
            }
          }
        }
      } catch(error) {
        this.result = {
          status: 'error',
          id: 'make-zap-request-failed',
          error: error
        }
      }
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
        console.log('Done!')
      }
    }
  }
}