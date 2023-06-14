<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const active = ref(false)

function toggle() {
  active.value = !active.value

  if(active.value === true) {
    window.emitter.emit('show-modal', {id: 'themes'})
  } else {
    window.emitter.emit('hide-modal', {id: 'themes'})
  }
}

function onShowModal(data) {
  if(data.id != 'themes') {
    active.value = false
  }
}

function onHideModal(data) {
  if(data.id === 'themes') {
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
    icon="brush"
    title="Change theme"
    :active="active"
    @click="toggle"
  />
</template>

<style scoped lang="scss">

.theme {

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {

  }

}

</style>
