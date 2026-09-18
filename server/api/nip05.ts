// https://github.com/nostr-protocol/nips/blob/master/05.md

export default defineEventHandler((event) => {
  // NIP-05 requires the CORS header so browser-based clients can verify addresses.
  // It's set here since the header rules in netlify.toml don't apply to functions.
  setResponseHeaders(event, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*'
  })

  // Relays where each account's profile, contacts and relay list could actually
  // be found when last checked (September 2026). Clients use these as a hint
  // for where to look, so dead relays here send them nowhere.
  const nostaRelays = [
    "wss://nos.lol",
    "wss://nostr.oxtr.dev",
    "wss://relay.ditto.pub",
    "wss://nostr.mom"
  ]

  const gbksRelays = [
    "wss://nos.lol",
    "wss://nostr.oxtr.dev",
    "wss://relay.ditto.pub",
    "wss://relay.nos.social",
    "wss://purplepag.es"
  ]

  const allData = {
    names: {
      "_": "128bc05aa6fd421d00c3c3389329f39cfc750b035db6cdad2eb0f983bff5629f",
      gbks: "b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525"
    },
    relays: {
      "128bc05aa6fd421d00c3c3389329f39cfc750b035db6cdad2eb0f983bff5629f": nostaRelays,
      "b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525": gbksRelays
    }
  }

  const query = getQuery(event)
  const userName = query.name

  let result = allData

  if(userName && allData.names[userName]) {
    const userPublicKey = allData.names[userName]

    result = {
      names: {},
      relays: {}
    }

    result.names[userName] = userPublicKey
    result.relays[userPublicKey] = allData.relays[userPublicKey]
  }

  return result
})