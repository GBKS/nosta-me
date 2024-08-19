<script setup>
import ToolBox from '@/helpers/toolBox'
import linkHelper from '@/helpers/linkHelper.js'
import { useRelayStore } from '@/stores/relays'
import useAssets from  '@/composables/useAssets.js'

const relayStore = useRelayStore()

const props = defineProps([
  'info',
  'layout',
  'handlers'
])

const contentTags = ['p', 't', 'word', 'e', 'a', 'r', 'relay', 'emoji']
const listImage = ref()

const emit = defineEmits(['select'])

function fillTemplate(template, count) {
  let result = template.split('{count}').join(count)

  const bits = result.split('{')
  let i=0, bit, nanoBits
  for(i=0; i<bits.length; i++) {
    bit = bits[i]
    if(bit.indexOf(' | ') !== -1) {
      nanoBits = bit.substr(0, bit.length-1).split(' | ')
      bits[i] = count == 1 ? nanoBits[0] : nanoBits[1]
    }
  }

  return bits.join('')
}

const listTypes = [
  { 
    id: 'kind',
    kind: 10000, 
    tags: ['p', 't', 'word', 'e'],
    title: '{count} {mute | mutes}',
    image: 'mute'
  },
  { 
    id: 'pin',
    kind: 10001, 
    tags: ['e'],
    title: '{count} {note | notes}',
    image: 'pin'
  },
  { 
    id: 'bookmarks',
    kind: 10003, 
    tags: ['e', 'a', 't', 'r'],
    title: '{count} {bookmark | bookmarks}',
    image: 'bookmarks'
  },
  { 
    id: 'communities',
    kind: 10004, 
    tags: ['a'],
    title: '{count} {community | communities}',
    image: 'pin'
  },
  { 
    id: 'public-chats',
    kind: 10005, 
    tags: ['e'],
    title: '{count} public {chat | chats}',
    image: 'pin'
  },
  { 
    id: 'blocked-relays',
    kind: 10006, 
    tags: ['relay'],
    title: '{count} blocked {relay | relays}',
    image: 'pin'
  },
  { 
    id: 'search-relays',
    kind: 10007, 
    tags: ['relay'],
    title: '{count} search {relay | relays}',
    image: 'pin'
  },
  { 
    id: 'interests',
    kind: 10015, 
    tags: ['t', 'a'],
    title: '{count} {tag | tags}',
    image: 'pin'
  },
  { 
    id: 'emoji',
    kind: 10030, 
    tags: ['emoji', 'a'],
    title: '{count} emoji',
    image: 'pin'
  },
  { 
    id: 'follow-set',
    kind: 30000, 
    tags: ['p'],
    title: '{count} {profile | profiles}',
    image: 'people'
  },
  { 
    id: 'relay-set',
    kind: 30002, 
    tags: ['relay'],
    title: '{count} {relay | relays}',
    image: 'pin'
  },
  { 
    id: 'bookmark-set',
    kind: 30003, 
    tags: ['e', 'a', 't', 'r'],
    title: '{count} {bookmark | bookmarks}',
    image: 'bookmarks'
  },
  { 
    id: 'curation-set',
    kind: 30004, 
    tags: ['a', 'e'],
    title: '{count} {post | posts}',
    image: 'pin'
  },
  { 
    id: 'interest-set',
    kind: 30015, 
    tags: ['t'],
    title: '{count} {tag | tags}',
    image: 'pin'
  },
  { 
    id: 'emoji-set',
    kind: 30030, 
    tags: ['emoji'],
    title: '{count} emoji',
    image: 'pin'
  }
]

const type = computed(() => {
  const result = listTypes.find(item => item.kind == props.info.kind)
  return result || {
    id: 'unknown',
    kind: 0,
    tags: [],
    title: ''
  }
})

const entryCount = computed(() => {
  const tags = props.info.tags.filter(tag => contentTags.indexOf(tag[0]) !== -1)
  return tags ? tags.length : 0
})

const title = computed(() => {
  let result = null

  let tag = props.info.tags.find(tag => tag[0] == 'title')

  if(!tag || tag.length == 1 || (tag.length > 1 && tag[1].length == 0)) {
    tag = props.info.tags.find(tag => tag[0] == 'name')
  }

  if(!tag || tag.length == 1 || (tag.length > 1 && tag[1].length == 0)) {
    tag = props.info.tags.find(tag => tag[0] == 'd')
  }

  if(tag && tag.length > 1 && tag[1].length != 0) {
    result = tag ? tag[1] : null

    result = ToolBox.trim(result, 25)

    result = result.charAt(0).toUpperCase() + result.substr(1)
  }

  return result
})

const description = computed(() => {
  let result = null

  let tag = props.info.tags.find(tag => tag[0] == 'description')
  if(tag && tag.length > 1 && tag[1].length > 0) {
    result = ToolBox.trim(tag[1], 50, 'end')
  }

  return result
})

const meta = computed(() => {
  return fillTemplate(type.value.title, entryCount.value)
})

async function updateListImage() {
  listImage.value = await useAssets('/assets/images/list-'+type.value.image+'.png')
}

const classObject = computed(() => {
  const c = ['lists-item']

  if(entryCount.value === 0) c.push('-empty')
  if(hasIdentifier.value) c.push('-link')

  c.push(props.layout ? ('-'+props.layout) : '-list')


  return c.join(' ')
})

const link = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'd')
  const relay = relayStore.getRelay(props.info.relay)
  const npub = window.NostrTools.nip19.npubEncode(props.info.pubkey)

  return linkHelper.address(
    tag[1],
    props.info.pubkey, 
    props.info.kind,
    relay.url,
    props.handlers,
    linkHelper.listr.list,
    npub
  )
})

const hasIdentifier = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'd')
  return !!tag
})

onBeforeMount(() => {
  updateListImage()
})
</script>

<template>
  <component
    :is="hasIdentifier ? 'a' : 'div'"
    :class="classObject"
    :href="hasIdentifier ? link : null"
    :target="hasIdentifier ? '_blank' : null"
    :rel="hasIdentifier ? 'nofollow noopener noreferrer' : null"
  >
    <div class="icon">
      <img
        :src="listImage"
        alt=""
      >
    </div>
    <div class="copy">
      <h5>{{ title }}</h5>
      <p v-if="description && description != title">{{ description }}</p>
      <p v-if="meta">{{ meta }}</p>
    </div>
  </component>
</template>

<style scoped lang="scss">

.lists-item {
  display: flex;
  align-items: center;
  gap: 15px;
  // padding: 10px 0;
  appearance: none;
  background-color: transparent;
  border-width: 0;
  text-align: left;
  text-decoration: none;
  padding: 7px 12px 6px 15px;
  border-radius: 15px;
  // margin-left: -15px;

  &.-link {
    &:hover {
      background-color: rgba(var(--theme-active-rgb), 0.1);
    }
  }

  .icon {
    flex-basis: 50px;
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 100px;
    overflow: hidden;
    background: linear-gradient(135deg, #22A2FF 0%, #6B10FF 100%);
    box-shadow: 
      0px 32px 32px rgba(0, 0, 0, 0.15), 
      0px 16px 16px rgba(0, 0, 0, 0.15), 
      0px 8px 8px rgba(0, 0, 0, 0.15), 
      0px 4px 4px rgba(0, 0, 0, 0.15), 
      0px 2px 2px rgba(0, 0, 0, 0.15);

    img {
      width: 50px;
      height: 50px;
    }
  }

  .copy {
    h5 {
      font-size: 17px;
      font-weight: 600;
      color: var(--theme-front);
      word-break: break-all;
    }

    p {
      font-size: 15px;
      color: white;
      opacity: 0.75;
    }
  }

  &.-empty {
    .icon {
      background: linear-gradient(145deg, #505050 0%, #7C7C7C 100%);
    }
  }

  &.-list {
    &:not(.-empty) + .lists-item.-empty {
      margin-top: 10px;
    }

    &.-empty {
      padding-top: 5px;
      padding-bottom: 5px;

      .icon {
        flex-basis: 25px;
        width: 25px;
        height: 25px;

        img {
          width: 25px;
          height: 25px;
        }
      }

      .copy {
        display: flex;
        align-items: center;
        gap: 10px;

        h5 {
          font-size: 15px;
          font-weight: 400;
        }
      }
    }
  }

  &.-box {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);
    transition: all 250ms $ease;

    .copy {
      flex-direction: column;
      align-items: flex-start;
    }

    &:hover {
      background-color: rgba(var(--theme-back-rgb), 0.3);
      border: 1px solid rgba(var(--theme-front-rgb), 0.3);
    }
  }
}

</style>
