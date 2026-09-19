/*

What we know about lists and sets (NIP-51).

"title" is a template for the line under the name of the list. {count} is the
number of entries, {one | many} picks the word that goes with it.

"name" is what a list is called when it has no title of its own.

"link" is where a set opens when the user has not recommended an app for its
kind (NIP-89). See linkHelper.address() for the placeholders.

 */

const LISTR = 'https://listr.lol/{npub}/{kind}/<bech32>'
const FOLLOWING_SPACE = 'https://following.space/d/{identifier}?p={pubkey}'

export const LIST_TYPES = [
  // Standard lists, one per user
  { id: 'mute', kind: 10000, title: '{count} {mute | mutes}', image: 'mute', name: 'Mutes' },
  { id: 'pin', kind: 10001, title: '{count} {note | notes}', image: 'pin', name: 'Pinned notes' },
  { id: 'bookmarks', kind: 10003, title: '{count} {bookmark | bookmarks}', image: 'bookmarks', name: 'Bookmarks' },
  { id: 'communities', kind: 10004, title: '{count} {community | communities}', image: 'people', name: 'Communities' },
  { id: 'public-chats', kind: 10005, title: '{count} public {chat | chats}', image: 'pin', name: 'Public chats' },
  { id: 'blocked-relays', kind: 10006, title: '{count} blocked {relay | relays}', image: 'pin', name: 'Blocked relays' },
  { id: 'search-relays', kind: 10007, title: '{count} search {relay | relays}', image: 'pin', name: 'Search relays' },
  { id: 'groups', kind: 10009, title: '{count} {group | groups}', image: 'people', name: 'Groups' },
  { id: 'favorite-relays', kind: 10012, title: '{count} favorite {relay | relays}', image: 'pin', name: 'Favorite relays' },
  { id: 'interests', kind: 10015, title: '{count} {tag | tags}', image: 'pin', name: 'Interests' },
  { id: 'git-authors', kind: 10017, title: '{count} {developer | developers}', image: 'people', name: 'Developers' },
  { id: 'git-repositories', kind: 10018, title: '{count} {repository | repositories}', image: 'bookmarks', name: 'Code repositories' },
  { id: 'media-follows', kind: 10020, title: '{count} {profile | profiles}', image: 'people', name: 'Media follows' },
  { id: 'emoji', kind: 10030, title: '{count} emoji', image: 'pin', name: 'Emoji' },
  { id: 'message-relays', kind: 10050, title: '{count} message {relay | relays}', image: 'pin', name: 'Message relays' },
  { id: 'media-servers', kind: 10063, title: '{count} media {server | servers}', image: 'pin', name: 'Media servers' },

  // Sets, as many as the user likes, told apart by their "d" tag
  { id: 'follow-set', kind: 30000, title: '{count} {profile | profiles}', image: 'people', link: LISTR, name: 'Follow set' },
  { id: 'relay-set', kind: 30002, title: '{count} {relay | relays}', image: 'pin', link: LISTR, name: 'Relay set' },
  { id: 'bookmark-set', kind: 30003, title: '{count} {bookmark | bookmarks}', image: 'bookmarks', link: LISTR, name: 'Bookmark set' },
  { id: 'curation-set', kind: 30004, title: '{count} {post | posts}', image: 'pin', link: LISTR, name: 'Curation set' },
  { id: 'video-set', kind: 30005, title: '{count} {video | videos}', image: 'bookmarks', link: LISTR, name: 'Video set' },
  { id: 'picture-set', kind: 30006, title: '{count} {picture | pictures}', image: 'bookmarks', link: LISTR, name: 'Picture set' },
  { id: 'kind-mute-set', kind: 30007, title: '{count} {mute | mutes}', image: 'mute', link: LISTR, name: 'Mute set' },
  { id: 'interest-set', kind: 30015, title: '{count} {tag | tags}', image: 'pin', link: LISTR, name: 'Interest set' },
  { id: 'emoji-set', kind: 30030, title: '{count} emoji', image: 'pin', link: LISTR, name: 'Emoji set' },
  { id: 'starter-pack', kind: 39089, title: 'Starter pack, {count} {profile | profiles}', image: 'people', link: FOLLOWING_SPACE, name: 'Starter pack' },
  { id: 'media-starter-pack', kind: 39092, title: 'Media starter pack, {count} {profile | profiles}', image: 'people', link: FOLLOWING_SPACE, name: 'Media starter pack' }
]

const UNKNOWN_TYPE = { id: 'unknown', kind: 0, title: '', image: 'unknown', name: 'List' }

// Tags that are entries of a list, as opposed to tags that describe it.
const CONTENT_TAGS = ['p', 't', 'word', 'e', 'a', 'r', 'relay', 'emoji', 'group', 'server']

function isAddressable(kind) {
  return kind >= 30000 && kind < 40000
}

function identifier(event) {
  const tag = (event.tags || []).find(tag => tag[0] == 'd')
  return tag && typeof tag[1] == 'string' ? tag[1] : ''
}

export default {
  kinds() {
    return LIST_TYPES.map(type => type.kind)
  },

  type(event) {
    return LIST_TYPES.find(type => type.kind == event.kind) || UNKNOWN_TYPE
  },

  // Public entries only. Private ones are encrypted in the content.
  entryCount(event) {
    return (event.tags || []).filter(tag => CONTENT_TAGS.indexOf(tag[0]) !== -1).length
  },

  // Lists get replaced when they change, and relays can still hold old versions.
  // Keeps the newest version of each list, in the order they were found.
  latestVersions(events) {
    const result = []
    const indexes = {}

    for(const event of (events || [])) {
      if(!event || !Array.isArray(event.tags)) continue

      const key = event.kind + ':' + event.pubkey + ':' + (isAddressable(event.kind) ? identifier(event) : '')

      if(indexes[key] === undefined) {
        indexes[key] = result.length
        result.push(event)
      } else if(event.created_at > result[indexes[key]].created_at) {
        result[indexes[key]] = event
      }
    }

    return result
  }
}
