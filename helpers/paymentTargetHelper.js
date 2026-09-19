/*

Finds the ways a user can be paid (NIP-A3).

These are "payto" tags like ["payto", "bitcoin", "bc1q…"] on a kind 10133 event.
The type is free text. The NIP lists common ones, and people use many more, as
well as other spellings ("xmr" for "monero"), so those are mapped where we know
them. An unknown type is shown as it was written.

 */

export const PAYMENT_TARGETS_KIND = 10133

const MAX_TARGETS = 20
const MAX_TYPE_LENGTH = 30
const MAX_ADDRESS_LENGTH = 500

const NAMES = {
  'bitcoin': 'Bitcoin',
  'lightning': 'Lightning',
  'bip352': 'Bitcoin silent payments',
  'bip353': 'Bitcoin DNS address',
  'lnurl': 'Lightning (LNURL)',
  'bolt12': 'Lightning (BOLT 12)',
  'liquid': 'Liquid',
  'ark': 'Ark',
  'paynym': 'PayNym',
  'geyser': 'Geyser',
  'bitcoincash': 'Bitcoin Cash',
  'cashme': 'Cash App',
  'dogecoin': 'Dogecoin',
  'ethereum': 'Ethereum',
  'litecoin': 'Litecoin',
  'monero': 'Monero',
  'nano': 'Nano',
  'paypal': 'PayPal',
  'revolut': 'Revolut',
  'solana': 'Solana',
  'stellar': 'Stellar',
  'ton': 'TON',
  'tron': 'Tron',
  'usdc': 'USDC',
  'usdt': 'USDT',
  'venmo': 'Venmo',
  'zcash': 'Zcash'
}

// Other spellings seen in the wild
const ALIASES = {
  'btc': 'bitcoin',
  'onchain': 'bitcoin',
  'on-chain': 'bitcoin',
  'silent payments': 'bip352',
  'bitcoin silent payments': 'bip352',
  'bitcoin (silent payments)': 'bip352',
  'lightning bolt 12': 'bolt12',
  'bch': 'bitcoincash',
  'bitcoin-cash': 'bitcoincash',
  'doge': 'dogecoin',
  'eth': 'ethereum',
  'ltc': 'litecoin',
  'xmr': 'monero',
  'sol': 'solana',
  'xlm': 'stellar',
  'zec': 'zcash'
}

function cleanType(value) {
  if(typeof value != 'string') return null

  const type = value.trim().toLowerCase()
  return type.length > 0 && type.length <= MAX_TYPE_LENGTH ? type : null
}

function cleanAddress(value) {
  if(typeof value != 'string') return null

  const address = value.trim()
  return address.length > 0 && address.length <= MAX_ADDRESS_LENGTH ? address : null
}

export default {
  name(type) {
    const known = NAMES[ALIASES[type] || type]
    return known || (type.charAt(0).toUpperCase() + type.substr(1))
  },

  // Takes the kind 10133 events that were found.
  // Returns [{ type, name, address }], in the order the user put them.
  // Addresses in "exclude" are left out, like the lightning address that is
  // already on the profile.
  targets(events, exclude) {
    // Relays can hold different versions, only the newest counts.
    const event = (events || [])
      .filter(event => event && event.kind == PAYMENT_TARGETS_KIND && Array.isArray(event.tags))
      .sort((a, b) => b.created_at - a.created_at)[0]

    if(!event) return []

    const excluded = (exclude || []).filter(Boolean).map(address => address.trim().toLowerCase())
    const seen = {}
    const result = []

    for(const tag of event.tags) {
      if(tag[0] != 'payto') continue

      const type = cleanType(tag[1])
      const address = cleanAddress(tag[2])
      if(!type || !address) continue

      if(excluded.indexOf(address.toLowerCase()) !== -1) continue

      const key = (ALIASES[type] || type) + ' ' + address
      if(seen[key]) continue
      seen[key] = true

      result.push({ type, name: this.name(type), address })

      if(result.length >= MAX_TARGETS) break
    }

    return result
  }
}
