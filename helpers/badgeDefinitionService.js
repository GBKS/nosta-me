import { reactive } from 'vue'

import multiRelayRequest from '@/helpers/multiRelayRequest.js'

/*

Loads badge definitions (kind 30009) for the badges shown on a profile.

Every badge on the page asks for its definition here. Requests made around the
same time are combined into a single relay request, as a profile can easily
show dozens of badges. Definitions are kept, so the summary and the full list
don't both load them.

Only call this in the browser.

 */

// How long to collect badges before asking the relays.
const BATCH_DELAY = 50

// Badge address ("30009:<pubkey>:<identifier>") to the newest definition event
const definitions = reactive({})

const requested = {}
let queue = []
let timer = null
let requests = []

function send() {
  timer = null

  const badges = queue
  queue = []

  // One filter per issuer, with all their badges in it.
  const filtersByIssuer = {}
  for(const badge of badges) {
    if(!filtersByIssuer[badge.pubkey]) {
      filtersByIssuer[badge.pubkey] = {
        kinds: [badge.kind],
        authors: [badge.pubkey],
        '#d': []
      }
    }

    filtersByIssuer[badge.pubkey]['#d'].push(badge.identifier)
  }

  const filters = Object.values(filtersByIssuer)
  if(filters.length == 0) return

  const request = multiRelayRequest()
  request.init(onDefinition)
  request.start(null, filters) // All known relays
  requests.push(request)
}

function onDefinition(event) {
  if(!event || !event.tags) return

  const identifierTag = event.tags.find(tag => tag[0] == 'd')
  if(!identifierTag) return

  const address = event.kind + ':' + event.pubkey + ':' + identifierTag[1]

  // Only what we asked for, and only the newest version of it.
  if(!requested[address]) return

  const current = definitions[address]
  if(!current || event.created_at > current.created_at) {
    definitions[address] = event
  }
}

export default {
  definitions,

  // Takes a badge as returned by badgeHelper.profileBadges()
  load(badge) {
    if(requested[badge.address]) return

    requested[badge.address] = true
    queue.push(badge)

    if(!timer) {
      timer = setTimeout(send, BATCH_DELAY)
    }
  },

  kill() {
    clearTimeout(timer)
    timer = null
    queue = []

    requests.forEach(request => request.kill())
    requests = []

    // Whatever didn't arrive can be asked for again.
    for(const address in requested) {
      if(!definitions[address]) delete requested[address]
    }
  }
}
