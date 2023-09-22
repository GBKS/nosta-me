
import { useRelayStore } from "@/stores/relays.js"

import relayList from '@/helpers/relayList.js'
import relayConnector from '@/helpers/relayConnector.js'
import relayManager from '@/helpers/relayManager.js'
import findRelayRequest from '@/helpers/findRelayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayRequest from '@/helpers/relayRequest.js'
import contactsService from '@/helpers/contactsService.js'

/*

Provides data to the profile page.
Main job is to check various relays for info on public keys.

 */

export default {
  log: false,
  initialized: false,
  publicKey: null,
  relaysToCheck: null, // Array of relayIds
  currentRelay: null, // Numerical index of relaysToCheck
  service: null,
  loadCallback: null,
  findCallback: null,
  searchType: null,
  contactsService: null,

  findProfile(publicKey, relaysToCheck, findCallback) {
    if(this.log) {
      console.log('profileService.findProfile', publicKey, relaysToCheck, findCallback)
    }
    
    this.reset()

    this.publicKey = publicKey
    this.findCallback = findCallback

    if(relaysToCheck) {
      this.searchType = 'relays-known'
      this.relaysToCheck = relaysToCheck
    } else {
      this.searchType = 'relays-unknown'
      this.relaysToCheck = relayManager.getAllRelayIds()
    }

    this.currentRelay = 0

    this.checkCurrentRelay()
  },

  checkCurrentRelay() {
    if(this.searchType == 'relays-known') {
      this.service = multiRelayRequest()
    } else {
      this.service = findRelayRequest()
    }

    this.loadCallback = this.onEvent.bind(this)
    this.service.init(this.loadCallback)

    if(this.log) {
      console.log('profileService.checkCurrentRelay', this.searchType, this.publicKey, this.relaysToCheck)
    }

    const createdContentFilter = {
      kinds: [
        0, // Profile info (meta data)
        2, // Recommended relays
        3, // Contacts
        1984, // Reports
        9735, // Zaps
        9041, // Zap goals
        10000, // Mute list
        10001, // Pin list
        10002, // Relay list meta data
        30000, // Categorized people
        30001, // Categorized bookmarks
        // 30009, // Badge definition
        // 8, // Badge award
        30008, // Badges
        30017, // Stall
        30018, // Product
        1063, // Files
        // 9802, // Highlights
        30311, // Live activities
        30402, // Classified
        31337, // Zapstr tracks
        31922, // Calendar events
        31923, // Calendar events
        31989, // Handler recommendation
        31990, // Handler information
      ],
      authors: [this.publicKey]
    }

    const statusFilter = {
      kinds: [30315],
      authors: [this.publicKey],
      limit: 1,
    }

    const receivedZapsFilter = {
      kinds: [9735],
      '#p': [this.publicKey]
    }

    this.service.start(this.relaysToCheck, [
      createdContentFilter,
      statusFilter,
      receivedZapsFilter
    ])
  },

  onEvent(data) {
    if(this.log) {
      console.log('profileService.onEvent', data)
    }

    this.findCallback(data)
    if(data.kind === 0) {
      // window.emitter.emit('profile-'+this.publicKey, data)
    } else if(data.kind == 2) {
      // window.emitter.emit('relays-'+this.publicKey, data)
    } else if(data.kind == 3) {
      this.loadContactList(data)
      // window.emitter.emit('contacts-'+this.publicKey, data)
    } else if(data.kind == 8) {
      // console.log('!!! Seeing a badge 8', data)
    } else if(data.kind == 1063) {
      // console.log('!!! Seeing a file', data)
    } else if(data.kind == 1984) {
      // console.log('!!! Seeing a report', data)
    } else if(data.kind == 9041) {
      console.log('!!! Seeing a zap goal', data)
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
    } else if(data.kind == 30311) {
      // console.log('!!! Seeing a live activity', data)
    } else if(data.kind == 30315) {
      console.log('!!! Seeing a user status', data)
    } else if(data.kind == 30402) {
      console.log('!!! Seeing a classified', data)
    } else if(data.kind == 31337) {
      console.log('!!! Seeing a Zapstr track', data)
    } else if(data.kind == 31922) {
      console.log('!!! Seeing a calendar event', data)
    } else if(data.kind == 31923) {
      console.log('!!! Seeing a calendar event', data)
    } else if(data.kind == 31989) {
      // console.log('!!! Seeing a handler recommendation', data)
    } else if(data.kind == 31990) {
      // console.log('!!! Seeing a handler information', data)
    } else if(data.type == 'end') {
      // this.checkNextRelay()
    }
  },

  checkNextRelay() {
    if(this.currentRelay < (this.relaysToCheck.length - 1)) {
      this.currentRelay++

      this.checkCurrentRelay()
    }
  },

  addRelay(relayId) {
    if(this.service && this.service.addRelay) {
      this.service.addRelay(relayId)
    }
  },

  reset() {
    if(this.service) {
      this.service.kill()
      this.service = null
    }

    if(this.contactsService) {
      this.contactsService.kill()
      this.contactsService = null
    }

    this.loadCallback = null
    this.findCallback = null
  },

  // Contact list
  loadContactList(data) {
    if(this.log) {
      console.log('profileService.loadContactList', data)
    }

    this.contactsService = contactsService()
    this.contactsService.start(data, this.onContactsEvent.bind(this))
  },

  onContactsEvent(data) {
    if(this.log) {
      console.log('profileService.onContactsEvent', data)
    }
  },

  loadContactsPage(page) {
    if(this.contactsService) {
      this.contactsService.loadPage(page)
    }
  }
}