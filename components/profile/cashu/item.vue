<script setup>
const mintInfo = ref(null)

const props = defineProps([
  'mintUrl'
])

const emit = defineEmits([
  'mintInfoLoaded'
])

async function loadData() {
  try {
    mintInfo.value = await $fetch(props.mintUrl + '/info')
    console.log('mintInfo', mintInfo.value)
    emit('mintInfoLoaded')
  } catch (error) {
    console.log('error', error)
  }
}

const title = computed(() => {
  let result

  if(mintInfo.value) {
    result = mintInfo.value.name
  }

  return result
})

const description = computed(() => {
  let result

  if(mintInfo.value) {
    result = mintInfo.value.description
  }

  return result
})

onBeforeMount(() => {
  loadData()
})

const classObject = computed(() => {
  const c = ['cashu-item']

  return c.join(' ')
})
</script>

<template>
  <div :class="classObject" v-if="mintInfo">
    <div 
      v-if="mintInfo.icon_url"
      class="image" 
    >
      <img
        :src="mintInfo.icon_url" 
        alt=""
      />
    </div>
    <div class="copy">
      <h5>{{ title }}</h5>
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.cashu-item {
  display: flex;
  flex-direction: column;
  padding: 15px;
  border-radius: 15px;
  background-color: rgba(var(--theme-back-rgb), 0.2);
  border: 1px solid rgba(var(--theme-front-rgb), 0.2);

  h5 {
    font-size: 17px;
    font-weight: 600;
    word-break: break-all;
    color: var(--theme-front);
  }

  p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;

    & + p {
      margin-top: 3px;
    }

    & + .tags {
      margin-top: 10px;
    }
  }
}

</style>
