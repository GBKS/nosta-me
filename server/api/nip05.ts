// https://github.com/nostr-protocol/nips/blob/master/05.md

export default defineEventHandler((event) => {
  event.res.setHeader('content-type', 'application/json')

  const defaultRelays = [
    "wss://brb.io",
    "wss://nos.lol",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.bitcoiner.social",
    "wss://nostr.onsats.org",
    "wss://nostr.orangepill.dev",
    "wss://nostr.zebedee.cloud",
    "wss://relay.current.fyi",
    "wss://relay.damus.io",
    "wss://relay.nostr.info",
    "wss://relay.snort.social"
  ]

  const allData = {
    names: {
      "_": "128bc05aa6fd421d00c3c3389329f39cfc750b035db6cdad2eb0f983bff5629f",
      gbks: "b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525"
    },
    relays: {
      "_": defaultRelays,
      "b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525": defaultRelays
    }
  }
  
  // const message = 'Works: ' + query.name

  // const publicKey = 'b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9'
  // const relays = [
  //   "wss://relay.example.com", 
  //   "wss://relay2.example.com"
  // ]

  // const result = {}

  // if(query.name) {
  //   result.names = {}
  //   result.names[query.name] = publicKey

  //   result.relays = {}
  //   result.relays[publicKey] = relays
  // }
  

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