/*

Constructs link notes to external clients.
Considers preferred handlers.

https://github.com/nostr-protocol/nips/blob/master/89.md

Information example:
{
    "kind": 31990,
    "pubkey": <pubkey>,
    "content": "<optional-kind:0-style-metadata>",
    "tags": [
        [ "d", <random-id> ],
        [ "k", <supported-event-kind> ],
        [ "web", "https://..../a/<bech32>", "nevent" ],
        [ "web", "https://..../p/<bech32>", "nprofile" ],
        [ "web", "https://..../e/<bech32>" ],
        [ "ios", ".../<bech32>" ]
    ]
}

 */

import { useRelayStore } from '@/stores/relays'
import { useHandlerStore } from '@/stores/handlers'

export default { 
  log: false,
  handlerStore: null,

  primal: {
    profile: 'https://primal.net/p/<bech32>',
    event: 'https://primal.net/e/<bech32>',
  },

  habla: {
    address: 'https://habla.news/a/<bech32>'
  },

  flockstr: {
    event: 'https://www.flockstr.com/event/<bech32>',
    calendar: 'https://www.flockstr.com/calendar/<bech32>'
  },

  badges: {
    badge: 'https://badges.page/b/<bech32>',
  },

  ostrich: {
    job: 'https://ostrich.work/jobs/<bech32>',
  },

  zap: {
    stream: 'https://zap.stream/<bech32>'
  },

  listr: {
    list: 'https://listr.lol/{npub}/{kind}/<bech32>'
  },

  address(eventId, authorPubkey, eventKind, eventRelay, handlers, fallbackUrl, npub) {
    const platform = 'web'
    const linkType = 'naddr'

    if(this.log) console.log('event', eventId, authorPubkey, eventKind, eventRelay, handlers)

    const bech = window.NostrTools.nip19.naddrEncode({
      kind: eventKind+'',
      identifier: eventId,
      pubkey: authorPubkey,
      relays: [eventRelay]
    })

    const handlerUrl = this.findMatchingHandler(handlers, platform, eventKind, linkType, fallbackUrl)

    const url = handlerUrl.replace('<bech32>', bech)

    if(this.log) console.log('handlerUrl', handlerUrl)
    if(this.log) console.log('url', url)

    let result = url
    if(npub) result = result.split('{npub}').join(npub)
    result = result.split('{kind}').join(eventKind)

    return result
  },

  event(eventId, eventRelay, eventKind, handlers, fallbackUrl) {
    const platform = 'web'
    const linkType = 'nevent'

    if(this.log) console.log('event', eventId, eventRelay, eventKind, handlers)

    const bech = window.NostrTools.nip19.neventEncode({
      id: eventId,
      relays: [eventRelay],
      kind: eventKind
    })

    const handlerUrl = this.findMatchingHandler(handlers, platform, eventKind, linkType, fallbackUrl)

    const url = handlerUrl.replace('<bech32>', bech)

    if(this.log) console.log('handlerUrl', handlerUrl)
    if(this.log) console.log('url', url)

    return url
  },

  /*
    This is such a wreck.

    1. Filter recommendations by ones that have matching kinds and platforms
    2. Extract the pubkeys of the handlers from the tags in those recommendations
    3. Get matching handlers for the pubkeys from the store
    4. Find the first of those handers that has a URL template for the link type we want
  
    Find a way to optimize this instead of running it dozens of times
    Maybe create an index of these as the handlers and recommendations are loaded
    Or cache them?
   */
  findMatchingHandler(handlers, platform, eventKind, linkType, fallbackUrl) {
    let result = fallbackUrl

    if(handlers) {
      // Filter handler recommendations by ones that support the kind and platform we want
      const kindHandlers = handlers.filter((handler) => {
        const kindTag = handler.tags.find(tag => tag[0] == 'd' && tag[1] == eventKind+'')
        if(kindTag) {
          const platformTag = handler.tags.find(tag => tag[0] == 'a' && tag[3] == platform)
          return platformTag !== undefined
        }
        return false
      })

      // Get handler pubkeys from the tags
      let handlerIds = [], i, k, handler, tag, handlerId
      for(i=0; i<kindHandlers.length; i++) {
        handler = kindHandlers[i]
        for(k=0; k<handler.tags.length; k++) {
          tag = handler.tags[k]
          if(tag[0] == 'a' && tag[3] == platform) {
            handlerId = tag[1].split(':')[1]

            if(handlerIds.indexOf(handlerId) === -1) {
              handlerIds.push(handlerId)
            }
          }
        }
      }

      if(!this.handlerStore) {
        this.handlerStore = useHandlerStore()
      }

      // Find matching handler objects in the store that match the pubkeys
      const handlersToUse = []
      for(i=0; i<handlerIds.length; i++) {
        handlerId = handlerIds[i]

        for(k in this.handlerStore.handlers) {
          handler = this.handlerStore.handlers[k]

          if(handler.pubkey == handlerId) {
            handlersToUse.push(handler)
          }
        }
      }

      // Finally dig up the URL template we need.
      let kindTag, eventTag
      for(i=0; i<handlersToUse.length; i++) {
        handler = handlersToUse[i]

        kindTag = handler.tags.find(tag => tag[0] == 'k' && tag[1] == eventKind+'')
        eventTag = handler.tags.find(tag => tag[0] == platform && tag[2] == linkType)

        if(kindTag && eventTag) {
          result = eventTag[1]
          break
        }
      }
    }

    return result
  }
}