<script setup>
const props = defineProps([
  'info',
  'activeId'
])

const emit = defineEmits(['select'])

const isActive = computed(() => {
  return props.info.id == props.activeId
})

const classObject = computed(() => {
  const c = ['profile-data-overlay-nav-item']

  if(isActive.value) {
    c.push('-active')
  }

  return c.join(' ')
})

function select() {
  emit('select', props.info.id)
}
</script>

<template>
  <button
    :class="classObject"
    :aria-pressed="isActive"
    @click="select"
  ><span>{{ info.name }}</span><span v-if="info.count > 0">{{ info.count }}</span></button>
</template>

<style scoped lang="scss">

.profile-data-overlay-nav-item {
  appearance: none;
  border-width: 0;
  background-color: transparent;
  text-align: left;
  color: var(--front);
  font-size: 15px;
  font-weight: 500;
  padding: 4px 9px;
  opacity: 0.5;
  border-radius: 3px;
  transition: all 150ms $ease;
  cursor: pointer;
  display: flex;

  span {
    white-space: nowrap;
    
    &:first-child {
      flex-grow: 1;
    }

    &:nth-child(2) {
      opacity: 0.5;
    }
  }

  &.-active {
    background-color: rgba(var(--front-rgb), 0.05);
    opacity: 1;
    cursor: default;
  }

  @include media-query(small) {
    flex-basis: 40%;
    flex-grow: 1;
    gap: 5px;
  }

  @include media-query(medium-up) {
    gap: 15px;
  }
}

</style>
