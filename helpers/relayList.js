/*

A list of well-established relays.

Primary relays are always connected to. They had the best coverage of
profile (kind 0) and relay list (kind 10002) events when tested, which
is what we need to find a profile when all we have is a public key.
The rest are picked from at random.

 */
export default {

  'nos-lol': {
    name: 'nos.lol',
    url: 'wss://nos.lol',
    primary: true
  },

  'oxtr-dev': {
    name: 'oxtr.dev',
    url: 'wss://nostr.oxtr.dev',
    primary: true
  },

  'purplepag-es': { // Indexer for profiles, contacts and relay lists
    name: 'Purple Pages',
    url: 'wss://purplepag.es',
    primary: true
  },

  'damus-io': { // Canada
    name: 'Damus',
    url: 'wss://relay.damus.io'
  },

  'primal-net': { // Germany
    name: 'Primal',
    url: 'wss://relay.primal.net'
  },

  'ditto-pub': {
    name: 'Ditto',
    url: 'wss://relay.ditto.pub'
  },

  'nos-social': {
    name: 'Nos',
    url: 'wss://relay.nos.social'
  },

  'nostr-mom': {
    name: 'nostr.mom',
    url: 'wss://nostr.mom'
  },

  'wellorder-net': { // Germany
    name: 'Wellorder',
    url: 'wss://nostr-pub.wellorder.net'
  },

  'offchain-pub': {
    name: 'Offchain',
    url: 'wss://offchain.pub'
  }

}
