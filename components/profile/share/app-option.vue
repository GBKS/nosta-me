<script setup>
const props = defineProps([
  'name',
  'description',
  'platform',
  'url',
  'image',
  'npub',
  'size'
])

const imageSource = computed(() => {
  const image =  '/images/apps/'+props.image+'.jpg'
  return image
})

const title = computed(() => {
  return 'View profile in '+props.name
})

const completeUrl = computed(() => {
  let result = props.url

  if(props.npub) {
    result = result.replace('{npub}', props.npub)
  }

  return result
})

const classObject = computed(() => {
  const c = ['share-app-option']

  if(props.size) {
    c.push('-'+props.size)
  }

  return c.join(' ')
})
</script>

<template>
  <NuxtLink
    :class="classObject"
    :to="completeUrl"
    target="_blank"
    rel="nofollow noopener noreferrer"
    :title="title"
  >
    <div class="icon">
      <img 
        :src="imageSource" 
        :alt="name"
      />
    </div>
    <p>{{ name }}</p>
    <p v-if="description">{{ description }}</p>
    <p v-if="platform">{{ platform }}</p>
  </NuxtLink>
</template>

<style scoped lang="scss">

.share-app-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 15px;
    background-color: #DEDEDE;
    box-shadow: 0 8px 16px -6px rgba(0, 0, 0, 0.25);
    transition: all 150ms $ease;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  p {
    font-size: 13px;
    color: rgba(black, 0.75);

    &:nth-of-type(1) {
      margin-top: 7px;      
    }
    
    &:nth-of-type(2),
    &:nth-of-type(3) {
      color: rgba(black, 0.5);
    }
  }

  &.-big {
    .icon {
      width: 100px;
      height: 100px;
      border-radius: 25px;
    }

    p {
      font-size: 15px;

      &:nth-of-type(1) {
        margin-top: 12px; 
      }
      
      &:nth-of-type(2),
      &:nth-of-type(3) {

      }
    }
  }

  &:hover {
    color: black;

    .icon {
      box-shadow: 0 4px 8px -3px rgba(0, 0, 0, 0.5);
      transform: scale(0.9, 0.9);
    }
  }
}

</style>
