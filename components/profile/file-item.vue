<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const imageStatus = ref(null)

const type = computed(() => {
  return ToolBox.findTag(props.info, 'm')[0]
})

const isImage = computed(() => {
  return (
    type.value.indexOf('jpeg') !== -1 || 
    type.value.indexOf('jpg') !== -1 || 
    type.value.indexOf('png') !== -1 || 
    type.value.indexOf('webp') !== -1
  )
})

const fileUrl = computed(() => {
  return ToolBox.findTag(props.info, 'url')[0]
})

const title = computed(() => {
  return props.info.content.length > 0 ? props.info.content : null
})

const formattedDate = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at)
})

const classObject = computed(() => {
  const c = ['file-item']

  if(isImage.value) {
    c.push('-image')

    if(imageStatus.value) {
      c.push('-'+imageStatus.value)
    }
  }

  return c.join(' ')
})

function imageLoaded() {
  imageStatus.value = 'loaded'
}

function imageLoadError() {
  imageStatus.value = 'error'
}

onMounted(() => {
  
})
</script>

<template>
  <a
    :class="classObject"
    :href="fileUrl"
    target="_blank"
    rel="nofollow noopener noreferrer"
  >
    <img
      v-if="isImage && imageStatus != 'error'"
      :src="fileUrl"
      @load="imageLoaded"
      @error="imageLoadError"
    />
    <div class="error"  v-if="isImage && imageStatus == 'error'">
      <p>Could not load the image</p>
    </div>
    <div 
      v-if="!isImage"
      class="unregognized" 
    >
      <p>{{ type }}</p>
    </div>
    <h5 v-if="title">{{ title }}</h5>
    <p>{{ formattedDate }}</p>
  </a>
</template>

<style scoped lang="scss">

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;

  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 5px;
    transition: all 250ms $ease;

    & + h5,
    & + p {
      margin-top: 20px;
    }
  }

  .unregognized,
  .error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 120px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);

    p {
      text-align: center;
    }

    & + h5,
    & + p {
      margin-top: 20px;
    }
  }

  h5 {
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
    text-align: center;
    word-break: break-all;
  }

  > p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
  }

  &.-image {
    img {
      opacity: 0;
    }

    &.-loaded {
      img {
        opacity: 1;
      }
    }

    &.-error {

    }
  }
}

</style>
