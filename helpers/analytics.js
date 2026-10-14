/*

Counts deliberate actions as Umami events, like opening a profile section or
saving a profile. Bots and scrapers load pages but rarely click, so these say
more about how people use the site than page views do.

The Umami dashboard is public. Event data must only ever say which kind of
thing happened: never public keys, npubs, event ids, addresses or anything
else a user typed.

 */

// Does nothing when Umami isn't there, like on the server or when an ad blocker
// stopped the script.
function track(name, data) {
  if(typeof window == 'undefined' || !window.umami) return

  try {
    window.umami.track(name, data)
  } catch(error) {
    // Counting must never get in the way of what the user is doing.
  }
}

// The event for an in-app navigation, or null. Only navigations from another
// page count; landing on a page directly is what bots do too.
function navigationEvent(to, from) {
  if(!from || !from.matched || from.matched.length == 0) return null
  if(to.path == from.path) return null

  const toPath = to.path.split('/')
  const fromPath = from.path.split('/')

  if(toPath[1] == 'create') {
    return { name: 'create-step', data: { step: toPath[2] || 'start' } }
  }

  if(toPath[1] == 'edit' && fromPath[1] != 'edit') {
    return { name: 'edit-open', data: { page: toPath[2] || 'profile' } }
  }

  if(to.name == 'id') {
    if(from.path == '/') return { name: 'profile-open', data: { from: 'home' } }
    if(from.path == '/directory') return { name: 'profile-open', data: { from: 'directory' } }
  }

  return null
}

// What a search was for, without what was typed.
function searchType(value) {
  if(value.indexOf('npub') === 0) return 'npub'
  if(value.indexOf('@') !== -1) return 'nostr-address'
  if(value.length == 64) return 'hex'
  return 'other'
}

export default {
  track,
  navigationEvent,
  searchType
}
