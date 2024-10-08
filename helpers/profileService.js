
import { useRelayStore } from "@/stores/relays.js"

import relayManager from '@/helpers/relayManager.js'
import findRelayRequest from '@/helpers/findRelayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayRequest from '@/helpers/relayRequest.js'
import contactsService from '@/helpers/contactsService.js'

/*

Provides data to the profile page.
Main job is to check various relays for info on public keys.

TODO: Pinstr
Messy here is the Pinstr integration. pinstr.app only looks at nos.lol right now.
Since we want to link out to that site, we can only recognize board events from the
nos.lol relay. So we set up a separate relay request for that. This needs to change
in the future. It's on the Pinstr dev to-do list.

 */

export default {
  logEnabled: false,
  initialized: false,
  publicKey: null,
  relaysToCheck: null, // Array of relayIds
  currentRelay: null, // Numerical index of relaysToCheck
  service: null,
  pinstrService: null,
  loadCallback: null,
  endCallback: null,
  internalEndCallback: null,
  findCallback: null,
  searchType: null,
  contactsService: null,
  contactList: null,

  findProfile(publicKey, relaysToCheck, findCallback, endCallback) {
    this.logger('findProfile', publicKey, relaysToCheck, findCallback)
    
    this.reset()

    this.publicKey = publicKey
    this.findCallback = findCallback
    this.endCallback = endCallback

    if(relaysToCheck) {
      this.searchType = 'relays-known'
      this.relaysToCheck = relaysToCheck
    } else {
      this.searchType = 'relays-unknown'
      this.relaysToCheck = relayManager.getAllRelayIds()
    }

    // Ensure we check 3 or more relays.
    if(!this.relaysToCheck || this.relaysToCheck.length < 3) {
      const relayStore = useRelayStore()
      this.logger('ensuring 3+ relays', this.relaysToCheck, relayStore.getRelayIds)
      this.relaysToCheck = relayStore.getRelayIds
    }

    this.currentRelay = 0

    // Check if our list of relays already includes nos.lol for Pinstr events
    let includePinstr = false
    for(let i=0; i<this.relaysToCheck.length; i++) {
      if(this.relaysToCheck[i] == 'nos-lol') {
        includePinstr = true
        break
      }
    }


    this.logger('relaysToCheck', this.relaysToCheck)

    this.checkCurrentRelay(includePinstr)

    if(!includePinstr) {
      this.checkPinstr()
    }
  },

  checkCurrentRelay(includePinstr) {
    // if(this.searchType == 'relays-known') {
      this.service = multiRelayRequest()
    // } else {
    //   this.service = findRelayRequest()
    // }

    this.loadCallback = this.onEvent.bind(this)
    this.internalEndCallback = this.onEndOfEvents.bind(this)
    this.service.init(this.loadCallback, this.endCallback)

    this.logger('checkCurrentRelay', this.searchType, this.publicKey, this.relaysToCheck)

    const createdContentKinds = [
      1984, // Reports
      9041, // Zap goals

      10000, // Mute list (NIP 51)
      10001, // Pinned notes list (NIP 51)
      10003, // Bookmarks list (NIP 51)
      10004, // Communities list (NIP 51)
      10005, // Public chats list (NIP 51)
      10006, // Blocked relays list (NIP 51)
      10007, // Search relays list (NIP 51)
      10015, // Interests list (NIP 51)
      10030, // Emoji list (NIP 51)
      30000, // Follow sets (NIP 51)
      // 30001, // Pin/bookmark/communities lists - deprecated (NIP 51)
      30002, // Relay sets (NIP 51)
      30003, // Bookmark sets (NIP 51)
      30004, // Curation sets (NIP 51)
      30015, // Interest sets (NIP 51)
      30030, // Emoji sets (NIP 51)

      30008, // Badges
      30017, // Stall
      30018, // Product
      1063, // Files
      30311, // Live activities
      30402, // Classified
      31337, // Zapstr tracks
      31922, // Calendar events
      31923, // Calendar events
      31924, // Calendar
      31989, // Handler recommendation
      31990, // Handler information

      37375 // Cashu wallet
    ]

    // If it's nos.lol, also check for Pinstr boards
    if(includePinstr) {
      createdContentKinds.push(33889)
    }

    const createdContentFilter = {
      kinds: createdContentKinds,
      authors: [this.publicKey]
    }
        // 1985, // Labels
        // 30009, // Badge definition
        // 8, // Badge award
        // 9802, // Highlights

    const profileFilter = {
      kinds: [0], // Profile info (meta data)
      authors: [this.publicKey],
      limit: 1,
    }

    const contactsFilter = {
      kinds: [3], // Contacts
      authors: [this.publicKey],
      limit: 1,
    }

    const relayFilter = {
      kinds: [10002], // Relay list meta data
      authors: [this.publicKey],
      limit: 1,
    }

    const relayMetaFilter = {
      kinds: [2], // Recommended relays
      authors: [this.publicKey],
      limit: 1,
    }

    const shortNoteFilter = {
      kinds: [1], // Short note
      authors: [this.publicKey],
      limit: 3,
    }

    const longNoteFilter = {
      kinds: [30023], // Long note
      authors: [this.publicKey],
      limit: 1,
    }

    const statusFilter = {
      kinds: [30315], // User status
      authors: [this.publicKey],
      limit: 1,
    }

    // Zaps only in last 30 days, otherwise they slow down things
    // TODO: Need to update the profile page copy to reflect that
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const sentZapsFilter = {
      kinds: [9735],
      authors: [this.publicKey],
      limit: 10,
      since: Math.round(oneMonthAgo / 1000)
    }

    const receivedZapsFilter = {
      kinds: [9735],
      '#p': [this.publicKey],
      limit: 10,
      since: Math.round(oneMonthAgo / 1000)
    }

    this.service.start(this.relaysToCheck, [
      profileFilter,
      contactsFilter,
      relayFilter,
      relayMetaFilter,
      shortNoteFilter,
      longNoteFilter,
      statusFilter,
      createdContentFilter,
      sentZapsFilter,
      receivedZapsFilter
    ])
  },

  checkPinstr() {
    // Check nos.lol for Pinstr boards if this relay is not already in the list
    const filter = {
      kinds: [33889],
      authors: [this.publicKey],
      limit: 50
    }

    const url = 'wss://nos.lol/'
    const relayId = relayManager.addRelayByUrl(url)

    this.logger('checkPinstr', relayId, filter)

    this.pinstrService = relayRequest()
    this.pinstrService.init(this.loadCallback, true)
    this.pinstrService.start(relayId, [filter])
  },

  onEvent(data) {
    this.logger('onEvent', data)

    let tag
    if(data.kind === 0) {
    } else if(data.kind == 1) {
      // console.log('!!! Seeing a short note', data)
    } else if(data.kind == 2) {
    } else if(data.kind == 3) {
      this.contactList = data
      // this.loadContactList(data)
    } else if(data.kind == 8) {
      // console.log('!!! Seeing a badge 8', data)
    } else if(data.kind == 1063) {
      // console.log('!!! Seeing a file', data)
    } else if(data.kind == 1984) {
      // console.log('!!! Seeing a report', data)
    } else if(data.kind == 1985) {
      console.log('!!! Seeing a label', data)
    } else if(data.kind == 9041) {
      // console.log('!!! Seeing a zap goal', data)
    } else if(data.kind == 9735) {
      // console.log('!!! Seeing a zap', data)
    } else if(data.kind == 9802) {
      console.log('!!! Seeing a highlight', data)
    } else if(data.kind == 10000) {
      // console.log('!!! Seeing mute list data', data)
    } else if(data.kind == 10001) {
      // console.log('!!! Seeing pin list data', data)
    } else if(data.kind == 10002) {
      // console.log('!!! Seeing relay list meta data', data)
    } else if(data.kind == 30000) {
      // console.log('!!! Seeing categorized people data', data)
    } else if(data.kind == 30001) {
      // console.log('!!! Seeing categorized bookmarks data', data)
    } else if(data.kind == 30008) {
      // console.log('!!! Seeing an accepted badge', data)
    } else if(data.kind == 30009) {
      // console.log('!!! Seeing a badge 30009', data)
    } else if(data.kind == 30017) {
      // console.log('!!! Seeing a stall', data)
    } else if(data.kind == 30018) {
      // console.log('!!! Seeing a product', data)
    } else if(data.kind == 30023) {
      // console.log('!!! Seeing a long note', data)
    } else if(data.kind == 30311) {
      // console.log('!!! Seeing a live activity', data)
    } else if(data.kind == 30315) {
      // console.log('!!! Seeing a user status', data)
    } else if(data.kind == 30402) {
      // console.log('!!! Seeing a classified', data)
    } else if(data.kind == 31337) {
      // console.log('!!! Seeing a Zapstr track', data)
    } else if(data.kind == 31922) {
      // console.log('!!! Seeing a calendar event', data)
    } else if(data.kind == 31923) {
      // console.log('!!! Seeing a calendar event', data)
    } else if(data.kind == 31924) {
      // console.log('!!! Seeing a calendar', data)
    } else if(data.kind == 31989) {
      // console.log('!!! Seeing a handler recommendation', data)
    } else if(data.kind == 31990) {
      // console.log('!!! Seeing a handler information', data)
    } else if(data.kind == 33889) {
      // console.log('!!! Seeing a Pinstr board', data)
    } else if(data.kind == 37375) {
      console.log('!!! Seeing a Cashu wallet', data)
    } else if(data.type == 'end') {
      // this.checkNextRelay()
    }

    this.findCallback(data)
  },

  onEndOfEvents() {
    if(this.endCallback) {
      this.endCallback()
    }
  },

  checkNextRelay() {
    if(this.currentRelay < (this.relaysToCheck.length - 1)) {
      this.currentRelay++

      this.checkCurrentRelay()
    }
  },

  addRelay(relayId) {
    this.logger('addRelay', relayId)

    if(this.service && this.service.addRelay) {
      this.service.addRelay(relayId)
    }
  },

  reset() {
    if(this.service) {
      this.service.kill()
      this.service = null
    }

    if(this.pinstrService) {
      this.pinstrService.kill()
      this.pinstrService = null
    }

    if(this.contactsService) {
      this.contactsService.kill()
      this.contactsService = null
    }

    this.loadCallback = null
    this.endCallback = null
    this.findCallback = null
  },

  // Contact list
  loadContactList(data) {
    this.logger('loadContactList', data)

    if(!data && this.contactList) {
      data = this.contactList
    }

    if(!this.contactsService) {
      this.contactsService = contactsService()
      this.contactsService.start(data, this.onContactsEvent.bind(this))
    }
  },

  onContactsEvent(data) {
    this.logger('onContactsEvent', data)
  },

  loadContactsPage(page) {
    this.logger('loadContactsPage', page)

    if(this.contactsService) {
      this.contactsService.loadPage(page)
    }
  },

  logger(...args) {
    if(this.logEnabled) {
      console.log('profileService', ...args)
    }
  }
}