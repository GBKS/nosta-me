import bolt11Decoder from 'light-bolt11-decoder'
import { verifyEvent } from 'nostr-tools/pure'

/*

Reads zap receipts (kind 9735, NIP-57).

A receipt is published by the recipient's lightning provider, not by the sender
or the recipient. Who zapped whom is in the zap request (kind 9734), which the
sender signed and the provider copied into the "description" tag. So:

- sender     the pubkey of the zap request (also the "P" tag of the receipt)
- recipient  the "p" tag
- comment    the content of the zap request
- amount     the bolt11 invoice

Anyone can publish a kind 9735 event, so receipts are checked before they are
shown. parse() checks what the receipt itself can prove: that the sender really
signed this request, and that the receipt matches it. That the payment happened
is only vouched for by the provider, which is why received zaps are also checked
against the provider's key, see isFromProvider().

 */

const ZAP_REQUEST_KIND = 9734
const ZAP_RECEIPT_KIND = 9735

function findTagValue(event, name) {
  const tag = event.tags.find(tag => tag[0] == name && typeof tag[1] == 'string')
  return tag ? tag[1] : null
}

function isHexKey(value) {
  return typeof value == 'string' && /^[0-9a-f]{64}$/.test(value)
}

function invoiceMillisats(bolt11) {
  try {
    const invoice = bolt11Decoder.decode(bolt11)
    const section = invoice.sections.find(section => section.name == 'amount')
    const amount = section ? parseInt(section.value) : NaN

    return amount > 0 ? amount : null
  } catch(error) {
    return null
  }
}

export default {
  // Returns the zap, or null if the receipt can't be trusted.
  parse(receipt) {
    if(!receipt || receipt.kind != ZAP_RECEIPT_KIND || !Array.isArray(receipt.tags)) return null

    const bolt11 = findTagValue(receipt, 'bolt11')
    const description = findTagValue(receipt, 'description')
    if(!bolt11 || !description) return null

    let request
    try {
      request = JSON.parse(description)
    } catch(error) {
      return null
    }

    if(!request || request.kind != ZAP_REQUEST_KIND || !Array.isArray(request.tags)) return null

    // Proves that the sender made this request. Also checks the event id.
    try {
      if(!verifyEvent(request)) return null
    } catch(error) {
      return null
    }

    // The request names exactly one recipient, and the receipt has to agree.
    const recipients = request.tags.filter(tag => tag[0] == 'p')
    if(recipients.length != 1 || !isHexKey(recipients[0][1])) return null

    const recipient = recipients[0][1]
    if(findTagValue(receipt, 'p') != recipient) return null

    // Optional on the receipt. If it's there, it's the sender.
    const senderTag = findTagValue(receipt, 'P')
    if(senderTag && senderTag != request.pubkey) return null

    const millisats = invoiceMillisats(bolt11)
    if(!millisats) return null

    // If the sender stated an amount, that's what the invoice has to be for.
    const requestedAmount = findTagValue(request, 'amount')
    if(requestedAmount && parseInt(requestedAmount) != millisats) return null

    return {
      id: receipt.id,
      requestId: request.id,
      provider: receipt.pubkey,
      sender: request.pubkey,
      recipient,
      millisats,
      sats: Math.round(millisats / 1000),
      comment: typeof request.content == 'string' ? request.content : '',
      created_at: receipt.created_at,
      relay: receipt.relay
    }
  },

  // Receipts only count if they come from the recipient's lightning provider,
  // which states its key as "nostrPubkey" at the LNURL pay endpoint.
  isFromProvider(zap, providerPublicKey) {
    return !!zap && isHexKey(providerPublicKey) && zap.provider == providerPublicKey
  },

  // Relays may hold several receipts for one payment. Keeps one per zap request.
  isDuplicate(zap, zaps) {
    return zaps.some(other => other.id == zap.id || other.requestId == zap.requestId)
  }
}
