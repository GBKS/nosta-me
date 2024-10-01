import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'
import { useSessionStore } from '@/stores/session'
import { useUserStore } from "@/stores/users.js"

export default function metaPublisher () { 
  return {
    logEnabled: !false,
    store: null,
    sessionStore: null,
    userStore: null,
    callback: null,
    relayId: null,
    relayIds: null,
    unsignedEvent: null,
    showNotifications: false,
    status: {
      status: 'default',
      request: null,
      requests: null
    },

    init() {
      if(!this.store) {
        this.store = useProfileStore()
        this.sessionStore = useSessionStore()
      }

      if(!this.relayId) {
        // const relayUrl = "wss://nostr.mutinywallet.com"
        const relayUrl = 'wss://relay.damus.io'
        this.relayId = relayManager.addRelayByUrl(relayUrl)
      }
    },

    // Save NIP-01 (kind 0) profile info
    // Blast everywhere so people can discover the profile
    publish(callback, rawContent, relayIds) {
      this.callback = callback
      this.relayIds = relayIds

      this.init()

      this.logger('publish', this.relayIds)

      const event = this.getBlankEvent()

      const content = rawContent ? rawContent : {
        name: this.store.name,
        about: this.store.about,
        website: this.store.website,
        picture: this.store.picture,
        banner: this.store.banner,
        nip05: this.store.handle,
        lud16: this.store.bitcoin
      }
      this.cleanContent(content)
      
      event.kind = 0
      event.tags = []
      event.content = JSON.stringify(content)

      this.logger('event', event, this.store.publicKey)
      this.signEvent(event)

      return this.status
    },

    publishToBlastr(event) {
      const request = relayPublishRequest()
      request.showNotification = this.showNotifications

      this.status.status = 'saving'
      this.status.request = request

      this.logger('publishToBlastr', event, this.status)

      // Blast it out
      request.publish(
        this.relayId,
        event,
        this.onResult.bind(this)
      )
    },

    publishToUserRelays(event) {
      this.status.requests = []

      this.logger('publishToUserRelays', this.store.relays, this.relayIds)

      let relay, request, relayId
      if(this.relayIds) {
        for(let i=0; i<this.relayIds.length; i++) {
          relayId = this.relayIds[i]

          this.logger('relayId', relayId)

          request = relayPublishRequest()
          request.showNotification = this.showNotifications
          this.status.requests.push(request)

          request.publish(
            relayId,
            event,
            this.onResult.bind(this)
          )
        }
      } else {
        for(let i=0; i<this.store.relays.length; i++) {
          relay = this.store.relays [i]

          if(relay.added) {
            relayId = relayManager.addRelayByUrl(relay.url)

            this.logger('relayId', relayId)

            request = relayPublishRequest()
            request.showNotification = this.showNotifications
            this.status.requests.push(request)

            request.publish(
              relayId,
              event,
              this.onResult.bind(this)
            )
          }
        }
      }

    },

    onResult(data) {
      this.logger('metaDataResult', data, this.callback)

      // Store updated user for later use
      if(data.status == 'success') {
        if(!this.userStore) {
          this.userStore = useUserStore()
        }
        this.userStore.addUser(data.event.pubkey, data.event)
      }

      this.status.status = data.status
      this.status.result = data

      this.callback(this.status)
    },

    // Helpers
    
    cleanContent(data) {
      let key, value
      for(key in data) {
        value = data[key]
        if(!value || value.length == 0) {
          delete data[key]
        }
      }
    },

    getBlankEvent() {
      return { 
        pubkey: this.sessionStore.isLoggedIn ? this.sessionStore.publicKey : this.store.publicKey,
        created_at: Math.floor(Date.now() / 1000) 
      }
    },

    signEvent(event) {
      let privateKey

      this.logger('isLoggedIn', event, this.sessionStore.isLoggedIn)

      if(this.sessionStore.isLoggedIn) {
        this.logger('loginType', this.sessionStore.loginType)

        if(this.sessionStore.loginType == 'browser') {
          // Request from browser.
          if(this.log) {
            console.log('window.nostr', window.nostr, window.nostr.enabled, window.nostr.enable)
          }

          if(!window.nostr.enabled && window.nostr.enable) {
            this.unsignedEvent = event
            this.enableBrowser()
          } else if(window.nostr.enabled === true || window.nostr.signEvent) {
            this.unsignedEvent = event
            this.onEnableBrowser()
          }
        } else if(this.sessionStore.loginType == 'privatekey') {
          privateKey = this.sessionStore.privateKey
        } else {
          this.logger('signEvent unknown login type')
        }
      } else {
        // Assuming we're in the edit flow - this needs to get cleaner.
        privateKey = this.store.privateKey
      }

      this.logger('signEvent', privateKey)

      if(privateKey) {
        event.id = window.NostrTools.getEventHash(event)
        event.sig = window.NostrTools.signEvent(event, privateKey)

        this.onSignEvent(event)
      }
    },

    enableBrowser() {
      this.logger('enableBrowser')

      window.nostr.enable()
        .then(this.onEnableBrowser.bind(this))
        .catch(this.onEnableBrowserFailed.bind(this))
    },

    onEnableBrowser() {
      this.logger('onEnableBrowser', this.unsignedEvent)

      window.nostr.signEvent(this.unsignedEvent)
        .then(this.onSignEvent.bind(this))
        .catch(this.onSignEventFailed.bind(this))
    },

    onEnableBrowserFailed() {
      this.logger('onEnableBrowserFailed', arguments)
    },

    onSignEvent(signedEvent) {
      this.logger('onSignEvent', signedEvent)

      // Blast it out
      this.publishToBlastr(signedEvent)

      // Also directly post to the relays the user added
      this.publishToUserRelays(signedEvent)
    },

    onSignEventFailed() {
      this.logger('onSignEventFailed', arguments)
    },

    // Tests

    testPublish(callback) {
      this.logger('testPublish', callback)
      this.callback = callback

      this.init()

      const event =  this.getBlankEvent()

      const content = {
        name: 'GBKS',
        display_name: "Christoph Ono",
        about: "Designer & developer. Helping improve bitcoin design with many others at http://bitcoin.design. I write a weekly update at http://gbks.substack.com.",
        website: "https://www.germanysbestkeptsecret.com/",
        picture: "https://www.germanysbestkeptsecret.com/avatar.jpg",
        // banner: this.store.banner,
        nip05: "gbks@nosta.me",
        lud06: "lnurl1dp68gurn8ghj7em9w3skccne9e3k7mf09emk2mrv944kummhdchkcmn4wfk8qtm8vf4hxklhntw",
        lud16: "gbks@getalby.com"
      }
      this.cleanContent(content)
      
      event.kind = 0
      event.tags = []
      event.content = JSON.stringify(content)

      const signedEvent = this.signEvent(event)
      const request = relayPublishRequest()

      this.status.status = 'saving'
      this.status.request = request

      this.logger('testPublishMetaData', signedEvent, this.status)

      const relayId = relayManager.addRelayByUrl('ws://umbrel.local:4848')
      request.publish(
        relayId,
        signedEvent,
        this.onResult.bind(this)
      )

      return this.status
    },

    kill() {
      this.logger('kill need to implement this')
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('MetaPublisher', ...args)
      }
    }
  }
}