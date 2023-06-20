import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useSessionStore } from '@/stores/session'
import ToolBox from '@/helpers/toolBox'


/*

Helps with some list-related things
- Picking out empty lists from an array of list events, and publishing delete requests

TODO: Need to show a confirm modal to ask users if they are sure.
TODO: Communicate that deletion is not guaranteed, the relay doesn't have to.
TODO: Hide deleted relays from the UI, or annotate them as deleted

 */

export default {
  log: false,
  sessionStore: null,
  groupedLists: null,
  requestQueue: null,

  deleteEmptyLists(lists) {
    if(this.log) console.log('ListsService.deleteEmptyLists', lists)

    // Group by relay
    const emptyLists = this.findEmptyLists(lists)
    const groupedLists = {}
    let i=0, list
    for(; i<emptyLists.length; i++) {
      list = emptyLists[i]
      if(!groupedLists[list.relay]) {
        groupedLists[list.relay] = []
      }
      groupedLists[list.relay].push(list)
    }

    this.requestQueue = {}
    this.groupedLists = groupedLists
    this.requestQueue = Object.keys(groupedLists)
    
    this.requestNextDeletion()
  },

  requestNextDeletion() {
    if(this.requestQueue && this.requestQueue.length > 0) {
      const relayId = this.requestQueue[0]
      this.requestQueue.splice(0, 1)
      const lists = this.groupedLists[relayId]

      this.deleteEmptyListsByRelay(relayId, lists)
    }
  },

  findEmptyLists(lists) {
    const result = []

    let event, tags
    for(let i=0; i<lists.length; i++) {
      event = lists[i]
      tags = ToolBox.findTagsExcluding(event, ['d'])
      if(!tags || tags.length == 0) {
        result.push(event)
      }
    }

    if(this.log) console.log('ListsService.findEmptyLists', result)

    return result
  },

  deleteEmptyListsByRelay(relayId, lists) {
    if(this.log) console.log('ListsService.deleteEmptyListsByRelay', relayId, lists)

    if(!this.sessionStore) {
      this.sessionStore = useSessionStore()
    }

    const event = {
      pubkey: this.sessionStore.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 5,
      content: '',
      tags: []
    }

    let i=0, list
    for(; i<lists.length; i++) {
      list = lists[i]
      event.tags.push(['e', list.id])
    }

    event.id = window.NostrTools.getEventHash(event)
    if(this.log) console.log('ListsService.event', relayId, event)
    // event.sig = window.NostrTools.signEvent(event, this.store.privateKey)

    // Sign the event via the browser

    const ref = this
    window.nostr.enable()
      .then(() => {
        if(this.log) console.log('ListsService.enable worked', event)

        window.nostr.signEvent(event)
          .then((signedEvent) => {
            if(this.log) console.log('ListsService.signEvent worked', signedEvent, relayId, ref.onDeleteEmptyList)
            // return
            const request = relayPublishRequest()
            request.publish(
              relayId,
              signedEvent,
              onDeleteEmptyLists
            )
            
            ref.requestNextDeletion()
          })
          .catch((relayId, event) => {
            console.log('signEvent failed')
          })
      })
      .catch(() => {
        console.log('enable failed', arguments)
      })
  },

  onDeleteEmptyList(status) {
    if(this.log) console.log('ListsService.onDeleteEmptyList', status)
  }
}