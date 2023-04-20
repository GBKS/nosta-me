<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'state'
])

const classObject = computed(() => {
  const c = ['save-icon', '-'+props.state]

  return c.join(' ')
})
</script>

<template>
  <div :class="classObject">
    <div class="spinner" />
    <div
      class="icon -check"
      v-html="Icons.check"
    />
    <div
      class="icon -arrow"
      v-html="Icons.arrowLeft"
    />
    <div
      class="icon -alert"
      v-html="Icons.alert"
    />
  </div>
</template>

<style scoped lang="scss">

.save-icon {
  width: 150px;
  height: 150px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  opacity: 0.1;
  border: 5px solid black;
  transition: all 400ms $ease;

  .spinner,
  .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transform-origin: center center;
    line-height: 0;
    opacity: 0;
    transition: all 400ms $ease;
  }

  .spinner {
    background: conic-gradient(rgba(var(--blue-rgb), 0), var(--blue));
    width: 160px;
    height: 160px;
    border-radius: 100px;
    transition: all 400ms $ease;

    &:before,
    &:after { 
      display: block;
      content: '';
      position: absolute;
      border-radius: 100px;
    }

    &:before { // White inner circle
      left: 5px;
      top: 5px;
      right: 5px;
      bottom: 5px;
      background-color: white;
    }

    &:after { // Small blue dot spinning around
      display: block;
      content: '';
      position: absolute;
      border-radius: 100px;
      width: 5px;
      height: 5px;
      top: 0;
      left: 50%;
      transform: translate(-50%);
      background-color: var(--blue);
    }
  }

  .icon {
    width: 150px;
    height: 150px;
    border-radius: 100px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    &.-check {
      :deep(svg) {
        width: 60px;
        height: 60px;
        color: white;
        transition: all 400ms $ease;
        transform: translateY(-125px);
      }
    }

    &.-arrow {
      :deep(svg) {
        width: 70px;
        height: 70px;
        color: black;
        transform: rotate(-90deg);
        transition: all 400ms $ease;
      }
    }

    &.-alert {
      :deep(svg) {
        width: 70px;
        height: 70px;
        color: black;
        transform: translateY(-125px);
        transition: all 400ms $ease;
      }
    }
  }

  &.-default {
    .icon {
      &.-arrow {
        opacity: 1;
      }
    }
  }

  &.-saving {
    position: relative;

    border-color: transparent;
    opacity: 1;

    .spinner {
      animation: spinLoader 1500ms linear infinite;
      opacity: 1;
    }

    .icon {
      &.-arrow {
        :deep(svg) {
          color: white;
          transform: rotate(-90deg) translateX(-125px);
        }
      }
    }
  }

  &.-success {
    opacity: 1;
    border-color: var(--green);
    background-color: var(--green);

    .icon {
      &.-check {
        opacity: 1;

        :deep(svg) {
          color: white;
          transform: translateY(0);
        }
      }
    }
  }

  &.-error {
    opacity: 1;
    border-color: var(--red);
    background-color: var(--red);

    .icon {
      &.-alert {
        opacity: 1;

        :deep(svg) {
          color: white;
          transform: translateY(0);
        }
      }
    }
  }
}

@keyframes spinLoader {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  100% {
    transform: translate(-50%, -50%) rotate(359deg);
  }
}

</style>
