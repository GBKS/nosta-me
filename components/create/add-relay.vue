<script setup>
import { ref, computed } from 'vue'

const isEditing = ref(false)
const inputModel = ref('')

const classObject = computed(() => {
  const c = ['add-relay']

  if(isEditing.value) {
    c.push('-editing')
  }

  return c.join(' ')
})

function toggle() {
  isEditing.value = !isEditing.value
}

function save() {
  toggle()
}

</script>

<template>
  <div :class="classObject">
    <button v-if="!isEditing" @click="toggle" size="small">Add another relay</button>
    <template v-if="isEditing">
      <input
        v-model="inputModel"
        placeholder="Enter stuff..."
      />
      <UiButton @click="save" size="small">Add</UiButton>
      <UiButton @click="toggle" size="small">Cancel</UiButton>
    </template>
  </div>
</template>

<style scoped lang="scss">

.add-relay {
  display: flex;
  gap: 15px;

  button {
    appearance: none;
    border-width: 0;
    background-color: transparent;
    font-size: 22px;
    padding: 15px 0;
    cursor: pointer;

    &:hover {
      color: var(--red);
    }
  }

  &.-editing {
    padding: 15px 0;
  }
}


</style>
