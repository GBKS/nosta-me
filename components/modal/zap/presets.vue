<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'amount',
  'options',
  'disabled'
])

const emit = defineEmits(['select'])

function select(amount) {
  emit('select', amount)
}
</script>

<template>
  <div class="zap-presets">
    <ModalZapPresetItem
      v-for="item in options"
      :key="item.name"
      :info="item"
      :disabled="disabled"
      @click="select(item.amount)"
    />
  </div>
</template>

<style scoped lang="scss">

.zap-presets {
  display: flex;
  gap: 10px;

  @include media-query(small) {
    justify-content: center;
  }

  @include media-query(medium-up) {
    justify-content: space-between;
    justify-content: center;
  }
}

</style>
