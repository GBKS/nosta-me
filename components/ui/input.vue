<script setup>
const props = defineProps([
  'modelValue',
  'placeholder',
  'type',
  'multiline',
  'maxlength',
  'disabled',
  'size'
])

const classObject = computed(() => {
  const c = []

  if(props.size) {
    c.push('-'+props.size)
  }

  return c.join(' ')
})

defineEmits([
  'update:modelValue',
  'focus',
  'blur',
  'paste'
])
</script>

<template>
  <input
    v-if="!multiline"
    :class="classObject"
    :placeholder="placeholder"
    :value="modelValue"
    :type="type ? type : 'text'"
    :maxlength="maxlength"
    :disabled="disabled"
    @input="$emit('update:modelValue', $event.target.value)"
    @focus="$emit('focus',)"
    @blur="$emit('blur')"
    @paste="$emit('paste', $event.target.value)"
  />
  <textarea
    v-if="multiline"
    :class="classObject"
    :placeholder="placeholder"
    :value="modelValue"
    :type="type ? type : 'text'"
    :maxlength="maxlength"
    :disabled="disabled"
    @input="$emit('update:modelValue', $event.target.value)"
    @focus="$emit('focus',)"
    @blur="$emit('blur')"
    @paste="$emit('paste', $event.target.value)"
  />
</template>

<style scoped lang="scss">

input,
textarea {
  @include r('font-size', 18, 22);
  appearance: none;
  padding: 20px;
  background-color: transparent;
  border: 1px solid rgba(var(--frontRGB), 0.25);
  border-radius: 15px;
  box-sizing: border-box;
  transition: all 150ms $ease;

  &.-small {
    padding: 10px;
    @include r('font-size', 15, 17);
    border-radius: 7px;
  }

  &::placeholder {
    color: rgba(black, 0.2);
  }

  &:hover {
    border-color: rgba(var(--frontRGB), 0.5);
  }

  &:focus {
    border-color: var(--red);
  }
}

</style>
