<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const emit = defineEmits(['back'])

const itemCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'd')
  return result ? ToolBox.trim(result[1], 50, 'end') : null
})

const description = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'description')
  return result ? ToolBox.trim(result[1], 50, 'end') : null
})

const category = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'c')
  return result ? result[1] : null
})

const type = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'f')
  return result ? result[1] : null
})

const pins = computed(() => {
  return props.info.tags.filter(tag => tag[0] == 'pin')
})

const meta = computed(() => {
  const bits = []

  if(category.value) bits.push(category.value)

  const pinCount = pins.value.length
  if(pinCount > 0 && type.value) {
    let bit = pinCount + ' ' + type.value + (pinCount == 1 ? '' : 's')
    bits.push(bit.toLowerCase())
  }

  return bits.length > 0 ? bits.join(' · ') : null
})

onMounted(() => {
  console.log('onMounted', props.info)
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="pinstr-board-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <p v-if="meta">{{ meta }}</p> 
      <ProfileBitsTags :info="info" max="5" align="left" />
      <ProfilePinstrPinList
        class="items"
        :info="info"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.pinstr-board-tab {
  > p {
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
  
  .items {
    margin-top: 25px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      > * {
        flex-basis: 40%;
      }
    }
  }

  @include media-query(medium) {
    .items {
      > * {
        flex-basis: 30%;
      }
    }
  }

  @include media-query(large) {
    .items {
      > * {
        flex-basis: 20%;
      }
    }
  }
}

</style>
