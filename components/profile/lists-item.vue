<script setup>
const props = defineProps([
  'info',
  'layout'
])

const type = computed(() => {
  let result = 'unknown'
  switch(props.info.kind) {
    case 10000:
      result = 'mute'
      break
    case 10001:
      result = 'pin'
      break
    case 30000:
      result = 'people'
      break
    case 30001:
      result = 'bookmarks'
      break
  }

  // Some clients also define mute lists with a 'd' tag
  // Not per spec, but whatever
  let i=0, tags=props.info.tags, tag
  for(; i<tags.length; i++) {
    tag = tags[i]
    if(tag[0] == 'd' && tag[1] == 'mute') {
      result = 'mute'
    }
  }

  return result
})

const entryCount = computed(() => {
  let result = 0

  for(let i=0; i<props.info.tags.length; i++) {
    if(props.info.tags[i][0] != 'd') {
      result ++
    }
  }

  return result
})

const descriptionTag = computed(() => {
  let result = null

  for(let i=0; i<props.info.tags.length; i++) {
    if(props.info.tags[i][0] == 'd') {
      result = props.info.tags[i][1]
      break
    }
  }

  return result
})

const title = computed(() => {
  let result = 'unknown ('+type.value+')'

  switch(type.value) {
    case 'mute':
      result = entryCount.value + ' muted profile' + (entryCount.value == 1 ? '' : 's')
      break
    case 'pin':
      result = entryCount.value + ' pinned note' + (entryCount.value == 1 ? '' : 's')
      break
    case 'people':
      if(descriptionTag.value) {
        result = descriptionTag.value

        if(descriptionTag.value.length > 20) {
          const bits = descriptionTag.value.split('/')
          if(bits.length == 3) {
            result = bits[0] + '/' + bits[1].substr(0, 5) + '...' + bits[1].substr(-5) + '/' + bits[2]
          }
        }
      } else {
        result = entryCount.value + ' profile' + (entryCount.value == 1 ? '' : 's')
      }
      break
    case 'bookmarks':
      result = entryCount.value + ' pinned note' + (entryCount.value == 1 ? '' : 's')
      break
  }

  return result
})

const description = computed(() => {
  let result = null

  switch(type.value) {
    case 'pin':
      result = entryCount.value + ' pinned note' + (entryCount.value == 1 ? '' : 's')
      break
    case 'people':
      result = entryCount.value + ' profile' + (entryCount.value == 1 ? '' : 's')
      break
    case 'bookmarks':
      result = entryCount.value + ' pinned note' + (entryCount.value == 1 ? '' : 's')
      break
  }

  return result
})

const listImage = computed(() => {
  const image =  '/assets/images/list-'+type.value+'.png'
  return useAssets(image)
})

const classObject = computed(() => {
  const c = ['lists-item']

  if(entryCount.value === 0) {
    c.push('-empty')
  }

  c.push(props.layout ? ('-'+props.layout) : '-list')

  return c.join(' ')
})
</script>

<template>
  <div :class="classObject">
    <div class="icon">
      <img
        :src="listImage"
        alt=""
      >
    </div>
    <div class="copy">
      <h5>{{ title }}</h5>
      <p v-if="description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.lists-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;

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
      padding: 5px 0;

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

    .copy {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

</style>
