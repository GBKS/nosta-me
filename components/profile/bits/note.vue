<script setup>
import * as linkify from "linkifyjs"
import linkifyStr from "linkify-string"
import UiUsername from '@/components/ui/username'
import relayManager from '@/helpers/relayManager.js'
import ToolBox from '@/helpers/toolBox'
import Icons from '@/helpers/icons'

const copyElement = ref(null)

const props = defineProps([
  'text',
  'info'
])

const ContentNode = () => {
  const text = props.text

  let children = []
  const images = []
  const tokens = linkify.tokenize(text)

  let i=0, token
  for(; i<tokens.length; i++) {
    token = tokens[i]

    if(token.t == 'url') {
      if(token.v.indexOf('nostr:npub') === 0) {
        const publicKey = window.NostrTools.nip19.decode(token.v.split(':')[1]).data;
        children.push(h(UiUsername, { publicKey }))
      } else if(token.v.indexOf('nostr:nprofile') === 0) {
        children.push(turnNProfileToNode(token.v))
      } else if(token.v.indexOf('nostr:nevent') === 0) {
        children.push(turnNEventToNode(token.v))
      } else if(token.v.indexOf('nostr:nrelay') === 0) {
        children.push(turnNRelayToNode(token.v))
      } else if(token.v.indexOf('nostr:naddr') === 0) {
        children.push(turnNAddrToNode(token.v))
      } else if(token.v.indexOf('nostr:note') === 0) {
        children.push(turnNoteToNode(token.v))
      } else if(token.v.indexOf('.webp') !== -1) {
        images.push(token)
      } else if(token.v.indexOf('.jpg') !== -1) {
        images.push(token)
      } else if(token.v.indexOf('.jpeg') !== -1) {
        images.push(token)
      } else if(token.v.indexOf('.png') !== -1) {
        images.push(token)
      } else if(token.v.indexOf('.gif') !== -1) {
        images.push(token)
      } else if(token.v.indexOf('.mov') !== -1) {
        children.push(turnVideoToNode(token.v, 'mp4'))
      } else if(token.v.indexOf('.mp4') !== -1) {
        children.push(turnVideoToNode(token.v, 'mp4'))
      } else if(token.v.indexOf('youtube.com/watch?') !== -1) {
        children.push(turnYoutubeToNode(token.v))
      } else {
        children.push(turnUrlToNode(token.v))
      }
    } else if(token.t == 'nl') {
      // No line breaks at the beginning.
      if(children.length > 0) {
        children.push(h('br'))
      }
    } else {
      children.push(token.v)
    }
  }

  const resultChildren = [
    h('div', { 
      class: 'copy',
      ref: 'copyElement'
    }, h('p', null, children))
  ]

  // Render images as a separate gallery at the bottom of the post.
  let gallery = null
  if(images.length > 0) {
    gallery = []
    for(i=0; i<images.length; i++) {
      gallery.push(turnImageToNode(images[i].v))
    }

    resultChildren.push(
      h('div', { class: 'gallery' }, gallery)
    )
  }

  return h('div', { class: 'note' }, resultChildren)
}

function turnUrlToNode(url) {
  let text = url
  if(text.indexOf('https://') === 0) text = text.substr(8)
  if(text.indexOf('http://') === 0) text = text.substr(7)

  if(url.indexOf('http') === -1) url = 'https://' + url

  return h('a', {
    href: url,
    innerHTML: ToolBox.trim(text, 25),
    rel: 'nofollow noopener noreferrer',
    target: '_blank'
  })
}

function turnNProfileToNode(text) {
  const { pubkey, relays } = window.NostrTools.nip19.decode(text.split(':')[1]).data;
  const relayIds = []
  if(relays) {
    let i=0, relayId
    for(; i<relays.length; i++) {
      relayId = relayManager.addRelayByUrl(relays[i])
      if(relayId) {
        relayIds.push(relayId)
      }
    }
  }
  return h(UiUsername, { publicKey: pubkey, relayIds })
}

function turnNEventToNode(text) {
  const bits = text.split(':')

  return h('a', { 
    href: 'https://primal.net/e/' + bits[1],
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
    class: '-event'
  }, 'View note')
}

function turnNoteToNode(text) {
  return h('a', { 
    href: 'https://primal.net/e/' + text.split(':')[1],
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
    class: '-note'
  }, 'View note')
}

function turnImageToNode(text) {
  return h('a', { 
    href: text,
    rel: 'nofollow noopener noreferrer',
    target: '_blank'
  }, h('img', { src: text }))
}

function turnNRelayToNode(text) {
  const data = window.NostrTools.nip19.decode(text.split(':')[1]).data;

  return h('a', {
    href: token.v,
    innerHTML: token.v,
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
    class: '-relay'
  }, token.v)
}

function turnNAddrToNode(text) {
  const data = window.NostrTools.nip19.decode(text.split(':')[1]).data;

  return h('a', {
    href: token.v,
    innerHTML: token.v,
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
    class: '-address'
  }, token.v)
}

function turnVideoToNode(text, extension) {
  const props = { controls: true }
  const meta = findUrlMeta(text)
  if(meta && meta.width && meta.height) {
    props.style = {
      aspectRatio: Math.round(meta.width/meta.height*100)/100
    }
  }

  return h('video', props, h('source', { 
    src: text,
    type: 'video/' + extension
  }))
}

function turnYoutubeToNode(text) {
  // https://www.youtube.com/watch?v=rqjO5Z9Lt_M
  const urlObject = new URL(text)
  const videoId = urlObject.searchParams.get('v')

  if(videoId) {
    const url = 'https://img.youtube.com/vi/' + videoId + '/0.jpg'

    return h('a', { 
        href: text,
        rel: 'nofollow noopener noreferrer',
        target: '_blank',
        class: '-video'
      }, 
      [
        h('img', { 
          src: url
        }),
        h('span', { innerHTML: Icons.video })
      ]
    )
  } else {
    return turnUrlToNode(text)
  }
}

function findUrlMeta(url) {
  let result = null

  const tags = props.info.tags.filter(tag => tag[0] == 'imeta')
  let i=0, tag, k, bits
  for(; i<tags.length; i++) {
    tag = tags[i]
    if(tag[1].indexOf(url) !== -1) {
      result = {
        tag: tag
      }

      for(k=0; k<tag.length; k++) {
        if(tag[k].indexOf('dim ') === 0) {
          // dim 720x1280
          bits = tag[k].split(' ')[1].split('x')
          result.width = parseInt(bits[0])
          result.height = parseInt(bits[1])
        }
      }

      break
    }
  }

  return result
}

</script>

<template>
  <ContentNode v-if="text" />
</template>

<style scoped lang="scss">

.note {
  color: var(--theme-text-medium);
  text-wrap: balance;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  :deep(.copy) {
    overflow: hidden;

    p {
      word-wrap: break-word;
      color: var(--theme-text-medium);
      text-wrap: balance;
      text-overflow: ellipsis;
      /* height: 100%; */
      -webkit-line-clamp: 10;
      line-clamp: 10;
      -webkit-box-orient: vertical;
      display: -webkit-box;

      a {
        color: var(--theme-text-medium);
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
          color: var(--theme-active);
        }
      }
    }

    video {
      margin-top: 5px;
      width: 100%;
      aspect-ratio: 1.78;
    }
  }

  :deep(.gallery) {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    a {
      flex-basis: 35%;
      // max-width: calc(50% - 10px);
      flex-grow: 1;
    }

    img {
      width: 100%;
      max-height: 200px;
      aspect-ratio: 1;
      border-radius: 5px;
      object-fit: cover;
      object-position: center;
    }
  }

  :deep(.-video) {
    position: relative;
    display: block;

    img {
      width: 100%;
      height: auto;
    }

    span {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      border: 1.5px solid white;
      border-radius: 100px;
      width: 35px;
      height: 35px;
      background-color: rgba(black, 0.5);
      transition: all 150ms $ease;

      svg {
        width: 18px;
        height: 18px;
        transform: translateX(2px);
        color: white;
      }
    }

    &:hover {
      span {
        transform: translate(-50%, -50%) scale(1.15);
      }
    }
  }
}

</style>
