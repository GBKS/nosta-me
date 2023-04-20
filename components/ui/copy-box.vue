<script setup>
const props = defineProps([
  'code'
])

const emit = defineEmits(['copy'])

const isCopied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.code);

  emit('copy')

  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}
</script>

<template>
  <div class="copy-box">
    <code v-html="code" />
    <UiButton 
      size="small"
      @click="copy" 
    >{{ isCopied ? 'Copied' : 'Copy' }}</UiButton>
  </div>
</template>

<style scoped lang="scss">

.copy-box {
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 20px;
  font-size: 22px;
  border-radius: 15px;
  border: 1px dashed rgba(black, 0.5);

  code {
    word-break: break-word;
    text-align: center;
  }
}

</style>
