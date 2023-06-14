<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Icons from '@/helpers/icons'

const active = ref(false)
const handlerData = ref(null)
const dialog = ref(null)

function onShowModal(data) {
  console.log('HandlerModal.onShowModal', data)

  const isActive = data.id === 'handler'

  if(isActive) {
    handlerData.value = data
  }

  active.value = isActive

  if(isActive) {
    setTimeout(showDialog, 50)
  }
}

function showDialog() {
  dialog.value.showModal()
}

function onHideModal(data) {
  if(data.id === 'handler') {
    active.value = false
  }
}

function close(id) {
  window.emitter.emit('hide-modal', {id: 'handler'})
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
  <Transition v-if="active" name="modal" appear>
    <dialog 
      class="handler-modal -modal"
      ref="dialog"
      @close="close"
    >
      <div class="wrap">
        <div class="content">
          <button
            class="-close"
            title="Close"
            v-html="Icons.cross"
            @click="close"
          />
          <ProfileHandlerItem
            :key="handlerData.appId"
            :appId="handlerData.appId"
            :data="handlerData.details"
            :info="handlerData.info"
            layout="full"
            theme="light"
          />
        </div>
        <div class="spacer" />
      </div>
    </dialog>
  </Transition>
</template>

<style scoped lang="scss">

.handler-modal {
  max-width: calc(100% - 30px);
  max-height: calc(100% - 30px);

  &::backdrop {

  }

  .wrap {
    padding: 0;
    box-sizing: border-box;

    .spacer {
      height: 15px;
    }

    .content {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      @include r('padding', 15, 25);
      position: relative;
      background-color: white;
      border-radius: 15px;
      box-sizing: border-box;

      button.-close {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 10px;
        appearance: none;
        background-color: transparent;
        border-width: 0;

        :deep(svg) {
          width: 16px;
          height: 16px;
          color: black;
        }
      }

      h3 {
        @include r('font-size', 17, 19);
        font-weight: 600;
        margin-bottom: 5px;
        text-align: center;
        color: white;
      }

      p {
        @include r('font-size', 17, 19);
        margin-bottom: 25px;
        text-align: center;
        color: white;
      }

      &.slide-enter-active,
      &.slide-leave-active {
        transition: all 350ms $ease;
      }
      &.slide-enter-from,
      &.slide-leave-to {
        opacity: 0;
        transform: translateY(-5px) scale(0.9, 0.9);
      }
    }
  }

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {
    .wrap {
      // display: flex;
      // align-items: center;
      // justify-content: center;
    }
  }
}

</style>
