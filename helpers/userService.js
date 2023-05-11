
import { useUserStore } from '@/stores/users'
import relayRequest from '@/helpers/relayRequest.js'

/*

Components can request user data here

window.emitter.on('profile-'+publicKey, loadCallback)
userService.getProfile(publicKey, relays)
window.emitter.off('profile-'+publicKey, loadCallback)

request: {
  publicKey,
  status: waiting, loading, loaded
}

 */

export default {
  log: false,
  requests: {},
  timer: null,
  delay: 50,
  userStore: null,

  getProfile(publicKey, relays) {
    let result 

    if(!this.userStore) {
      this.userStore = useUserStore()
    }

    const user = this.userStore.getUser(publicKey)
    if(user) {
      // Already loaded
      result = user
    } else if(!this.requests[publicKey]) {
      // Requested, but not loaded yet
    } {
      // First time requesting
      this.requests[publicKey] = {
        relays,
        status: 'waiting'
      }

      this.startTimer()
    }

    if(this.log) {
      console.log('UserService.getProfile', publicKey, relays, this.requests)
    }

    return result
  },

  onTimer() {
    const requestsByRelay = this.gatherRequestsByRelay()

    if(this.log) {
      console.log('UserService.onTimer', requestsByRelay)
    }

    let relay, publicKeys, request
    for(relay in requestsByRelay) {
      publicKeys = requestsByRelay[relay]

      request = relayRequest()
      request.init(this.onUserData.bind(this), true)
      request.start(
        relay,
        [{
          kinds: [0],
          authors: publicKeys
        }]
      )
    }
  },

  gatherRequestsByRelay() {
    const requestsByRelay = {}

    let publicKey, request, k, relay
    for(publicKey in this.requests) {
      request = this.requests[publicKey]

      if(request.status == 'waiting') {
        for(k=0; k<request.relays.length; k++) {
          relay = request.relays[k]

          if(!requestsByRelay[relay]) {
            requestsByRelay[relay] = []
          }

          this.requests[publicKey].status == 'loading'

          requestsByRelay[relay].push(publicKey)
        }
      }
    }

    return requestsByRelay
  },

  onUserData(data) {
    if(this.log) {
      console.log('UserService.onUserData', data, this.requests)
    }

    if(this.requests[data.pubkey]) {
      this.requests[data.pubkey].status == 'loaded'
    }
  },

  startTimer() {
    this.stopTimer()

    this.timer = setTimeout(this.onTimer.bind(this), this.delay)
  },

  stopTimer() {
    if(this.timer) {
      clearTimeout(this.timer)
    }
  }
}