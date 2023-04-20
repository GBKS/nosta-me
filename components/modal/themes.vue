<script setup>
import { useSessionStore } from '@/stores/session'
import Icons from '@/helpers/icons'

const sessionStore = useSessionStore()
const activeThemeId = ref('space')
const active = ref(false)

function onShowModal(id) {
  active.value = id === 'themes'
}

function onHideModal(id) {
  if(id === 'themes') {
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

function close() {
  window.emitter.emit('hide-modal', 'themes')
}

function selectTheme(value) {
  sessionStore.setTheme(value)

  window.emitter.emit('set-theme', value)

  close()
}
</script>

<template>
  <Transition v-if="active" name="modal" appear>
    <div class="modal-relays -modal">
      <div class="wrap">
        <div class="content">
          <ThemeList
            :activeThemeId="sessionStore.theme"
            @selectTheme="selectTheme"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.modal-relays {
  .wrap {
    .content {
      max-width: 900px;
      @include r('padding-left', 40, 20);
      @include r('padding-right', 40, 20);
    }
  }

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {
    
  }
}

</style>
