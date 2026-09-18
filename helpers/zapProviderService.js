/*

Finds the key a lightning provider signs zap receipts with (NIP-57).

The provider states it as "nostrPubkey" at the LNURL pay endpoint of a lightning
address. A zap receipt for that address only counts if it was signed with this
key, otherwise anyone could publish receipts for payments that never happened.

Only lightning addresses (lud16) are supported, like everywhere else on the site.

 */

const TIMEOUT = 8000

export const PROVIDER_STATUS = {
  FOUND: 'found', // We have the key
  NONE: 'none', // The provider answered, and doesn't do zaps
  UNKNOWN: 'unknown' // Couldn't ask, so we can't tell
}

// Lightning address to a promise of the result
const lookups = {}

export function endpointForAddress(address) {
  if(typeof address != 'string') return null

  const bits = address.trim().toLowerCase().split('@')
  if(bits.length != 2 || !bits[0] || !bits[1]) return null

  // The address comes from a profile, so make sure it can only turn into a
  // plain request for the well-known path on that one domain.
  if(!/^[a-z0-9._+-]+$/.test(bits[0])) return null
  if(!/^[a-z0-9.-]+(:[0-9]+)?$/.test(bits[1])) return null

  try {
    const url = new URL('https://' + bits[1] + '/.well-known/lnurlp/' + bits[0])
    return url.host == bits[1] ? url.toString() : null
  } catch(error) {
    return null
  }
}

export function resultFromResponse(body) {
  if(!body || typeof body != 'object') return { status: PROVIDER_STATUS.UNKNOWN }

  const publicKey = body.nostrPubkey
  if(body.allowsNostr && typeof publicKey == 'string' && /^[0-9a-f]{64}$/.test(publicKey)) {
    return { status: PROVIDER_STATUS.FOUND, publicKey }
  }

  return { status: PROVIDER_STATUS.NONE }
}

async function lookup(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    })

    if(!response.ok) return { status: PROVIDER_STATUS.UNKNOWN }

    return resultFromResponse(await response.json())
  } catch(error) {
    // Offline, blocked by CORS, timed out or not JSON
    return { status: PROVIDER_STATUS.UNKNOWN }
  } finally {
    clearTimeout(timer)
  }
}

export default {
  // Resolves to { status, publicKey }
  find(address) {
    const url = endpointForAddress(address)
    if(!url) return Promise.resolve({ status: PROVIDER_STATUS.UNKNOWN })

    if(!lookups[url]) {
      lookups[url] = lookup(url)
    }

    return lookups[url]
  }
}
