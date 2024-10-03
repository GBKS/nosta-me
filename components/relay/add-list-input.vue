<script setup>
const props = defineProps([
  'active'
])

const emit = defineEmits([
  'add'
])

const inputValue = ref('')

function addRelay() {
  // Check if input value is a valid websocket URL, but not necessarily with the wss:// or ws:// prefix
  const isValid = inputValue.value.match(/^(wss:\/\/|ws:\/\/)?[a-zA-Z0-9-_.]+(:[0-9]+)?$/)
  if(isValid) {
    let relayUrl = inputValue.value

    // Add the wss:// prefix if it's not already there
    relayUrl = relayUrl.startsWith('wss://') || relayUrl.startsWith('ws://') ? relayUrl : 'wss://' + relayUrl

    emit('add', relayUrl)
    inputValue.value = ''
  }
}
</script>

<template>
  <div class="relay-add-list-input">
    <input
      type="text"
      placeholder="Enter relay URL..."
      v-model="inputValue"
    />
    <button
      @click="addRelay"
    >Add</button>
  </div>
</template>

<style scoped lang="scss">

.relay-add-list-input {
  display: flex;
  align-items: stretch;
  background-color: #f4f4f4;
  border-radius: 5px;
  padding: 8px 8px 8px 12px;

  input {
    flex-grow: 1;
    appearance: none;
    background-color: transparent;
    border-width: 0;

    &:focus-visible {
      outline: none;
    }
  }

  button {
    appearance: none;
    background-color: #000000;
    color: white;
    border-width: 0;
    padding: 4px 12px;
    border-radius: 3px;
  }


}

</style>
