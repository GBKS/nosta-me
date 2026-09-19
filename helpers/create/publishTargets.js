import relayManager from '@/helpers/relayManager.js'

/*

Where the events of a new profile go.

To the relays the user picked, plus two that are there so others can find the
profile: a big relay most clients ask, and an indexer for profiles, follows and
relay lists (NIP-65 says to spread the relay list widely). With a single target,
one relay being down meant the event was never saved.

 */

export const DISCOVERY_RELAYS = [
  'wss://relay.damus.io',
  'wss://purplepag.es'
]

// relays: the relays of the profile store, [{ url, added }]
// Returns relay ids, each once.
export default function publishTargets(relays) {
  const urls = (relays || []).filter(relay => relay && relay.added && relay.url).map(relay => relay.url)
  const result = []

  for(const url of urls.concat(DISCOVERY_RELAYS)) {
    const relayId = relayManager.addRelayByUrl(url)

    if(relayId && result.indexOf(relayId) === -1) {
      result.push(relayId)
    }
  }

  return result
}
