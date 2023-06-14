<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRelayStore } from '@/stores/relays'
import Icons from '@/helpers/icons'

let store

const active = ref(false)

onMounted(() => {
  store = useRelayStore()
})

function onShowModal(data) {
  active.value = data.id === 'relays'
}

function onHideModal(data) {
  if(data.id === 'relays') {
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
  <Transition v-if="active" name="modal" appear>
    <div class="relay-modal -modal">
      <div class="wrap">
        <div class="content">
          <h3>Relays</h3>
          <p>Servers you are connecting to for loading profile information.</p>
          <ModalRelayList
            :info="store.relays"
            :showStatus="true"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.relay-modal {
  .wrap {
    .content {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      @include r('padding-left', 15, 20);
      @include r('padding-right', 15, 20);
      @include r('padding-bottom', 20, 40);

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
    
  }
}

</style>
