import { SimplePool } from 'nostr-tools/pool'
import { verifyEvent } from 'nostr-tools/pure'

/*

Reads what the gm sky needs from relays.

Everyone's greetings come from relays that support search (NIP-50); the
greetings of people you follow come from regular relays. The sky has its own
pool, which is closed when you leave the page. That pool doesn't check
signatures on arrival: search results are mostly notes that aren't greetings,
and checking thousands of signatures only to throw the notes away would block
the page. Only events the sky keeps get checked.

 */

export const SEARCH_RELAYS = ['wss://relay.ditto.pub', 'wss://search.nos.today']
export const READ_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nos.social', 'wss://nostr.mom']
export const PROFILE_RELAYS = ['wss://purplepag.es', 'wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net']
const LIVE_RELAYS = READ_RELAYS.slice(0, 3)
const SEARCH_TERMS = ['gm', 'good morning', 'gn', 'good night']

export function chunk(list, size) {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))
}

// Runs async tasks, a few at a time.
export async function runLimited(tasks, limit) {
  const queue = tasks.slice()
  await Promise.all(Array.from({ length: limit }, async () => {
    while(queue.length) await queue.shift()()
  }))
}

function isValid(event) {
  try {
    return verifyEvent(event)
  } catch(error) {
    return false
  }
}

export function createLoader() {
  const pool = new SimplePool({ verifyEvent: () => true, enablePing: true })
  const open = new Set() // subscriptions, so they can all be closed when leaving
  let closed = false

  // One request to several relays, done when they all answered or timed out.
  // `accept` filters events before their signature is checked.
  function query(relays, filter, { accept, onEvent, maxWait = 9000 }) {
    return new Promise(resolve => {
      if(closed) return resolve()

      let done = false
      let sub = null
      const finish = () => {
        if(done) return
        done = true
        clearTimeout(timer)
        if(sub) open.delete(sub)
        resolve()
      }
      const timer = setTimeout(finish, maxWait + 2000)

      sub = pool.subscribeManyEose(relays, filter, {
        maxWait,
        onevent: event => {
          if(closed) return
          if(accept && !accept(event)) return
          if(!isValid(event)) return
          onEvent(event)
        },
        onclose: finish
      })
      if(!done) open.add(sub)
    })
  }

  return {
    // The newest contact list of a person.
    async loadContacts(pubkey) {
      let newest = null
      await query(PROFILE_RELAYS, { kinds: [3], authors: [pubkey], limit: 1 }, {
        accept: event => event.pubkey == pubkey,
        onEvent: event => {
          if(!newest || event.created_at > newest.created_at) newest = event
        },
        maxWait: 6000
      })
      return newest
    },

    // Greetings between since and until: everyone's, or only from `authors`.
    // Asks for a few hours at a time, since relays stop at a few hundred
    // results per request.
    async loadGreetings({ since, until, authors, accept, onEvent }) {
      const tasks = []

      if(!authors) {
        for(let from = since; from < until; from += 10800) {
          const to = Math.min(until, from + 10800)
          for(const term of SEARCH_TERMS) {
            tasks.push(() => query(SEARCH_RELAYS, { kinds: [1], search: term, since: from, until: to, limit: 500 }, { accept, onEvent }))
          }
        }
      } else {
        for(const group of chunk(authors, 200)) {
          for(let from = since; from < until; from += 21600) {
            const to = Math.min(until, from + 21600)
            tasks.push(() => query(READ_RELAYS, { kinds: [1], authors: group, since: from, until: to, limit: 500 }, { accept, onEvent }))
          }
        }
      }

      await runLimited(tasks, 4)
    },

    // Reactions and zap receipts for the given note ids.
    async loadPiles(ids, since, onEvent) {
      const tasks = []
      for(const group of chunk(ids, 150)) {
        tasks.push(() => query(READ_RELAYS, { kinds: [7], '#e': group, since }, { onEvent, maxWait: 8000 }))
        tasks.push(() => query(READ_RELAYS, { kinds: [9735], '#e': group, since }, { onEvent, maxWait: 8000 }))
      }
      await runLimited(tasks, 3)
    },

    async loadProfiles(pubkeys, onEvent) {
      await runLimited(chunk(pubkeys, 300).map(group => () =>
        query(PROFILE_RELAYS, { kinds: [0], authors: group }, { onEvent, maxWait: 7000 })
      ), 2)
    },

    // Keeps listening for new greetings and new pile-ins until close().
    listen({ since, authors, ids, accept, onGreeting, onPile }) {
      if(closed) return

      const check = (onEvent, filterFn) => event => {
        if(closed) return
        if(filterFn && !filterFn(event)) return
        if(!isValid(event)) return
        onEvent(event)
      }

      if(!authors) {
        open.add(pool.subscribeMany(LIVE_RELAYS, { kinds: [1], since }, { onevent: check(onGreeting, accept) }))
      } else {
        for(const group of chunk(authors, 200)) {
          open.add(pool.subscribeMany(LIVE_RELAYS, { kinds: [1], authors: group, since }, { onevent: check(onGreeting, accept) }))
        }
      }

      for(const group of chunk(ids, 150)) {
        open.add(pool.subscribeMany(LIVE_RELAYS, { kinds: [7, 9735], '#e': group, since }, { onevent: check(onPile) }))
      }
    },

    // Closes the subscriptions first and the connections a moment later:
    // a relay sends its CLOSE message only once the socket is ready, and
    // closing the socket right away would make those messages fail.
    close() {
      closed = true
      open.forEach(sub => sub.close())
      open.clear()
      setTimeout(() => {
        try {
          pool.destroy()
        } catch(error) {
          // Already gone
        }
      }, 1500)
    }
  }
}
