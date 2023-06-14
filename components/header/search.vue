<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const active = ref(false)

function toggle() {
  active.value = !active.value

  if(active.value === true) {
    window.emitter.emit('show-modal', {id: 'search'})
  } else {
    window.emitter.emit('hide-modal', {id: 'search'})
  }
}

function onShowModal(data) {
  if(data.id != 'search') {
    active.value = false
  }
}

function onHideModal(data) {
  if(data.id === 'search') {
    active.value = false
  }
}

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)
})

onBeforeUnmount(() => {
  window.emitter.off('show-modal', onShowModal)
  window.emitter.off('hide-modal', onHideModal)
})
</script>

<template>
  <HeaderIconButton
    icon="search"
    title="Search profiles"
    :active="active"
    @click="toggle"
  />
</template>

<style scoped lang="scss">

.search {

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {

  }

}

</style>
