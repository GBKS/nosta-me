<script setup>
import { computed, useSlots } from 'vue'

import Icons from '@/helpers/icons'

const slots = useSlots()

const props = defineProps([
  'class',
  'to',
  'href',
  'disabled',
  'icon',
  'size', // tiny, small, medium, large
  'look', // chunky, tab, outline
  'title'
])

const classObject = computed(() => {
  const c = [
    '-'+(props.size || 'medium'),
    '-'+(props.look || 'chunky')
  ]

  if(props.class) c.push(props.class)
  if(props.icon) c.push('-icon')
  if(props.disabled) c.push('-disabled')
  if(!slots.default) c.push('-empty')

  return c.join(' ')
})

defineEmits(['click'])
</script>

<template>
  <NuxtLink
    v-if="props.to"
    :class="classObject"
    :to="props.to"
    :title="title"
  >
    <p>
      <slot />
      <span
        v-if="props.icon"  
        v-html="Icons[props.icon]"
      />
    </p>
  </NuxtLink>
  <a
    v-if="props.href"
    :class="classObject"
    :to="props.href"
    :title="title"
    target="_blank"
  >
    <p>
      <slot />
      <span
        v-if="props.icon"  
        v-html="Icons[props.icon]"
      />
    </p>
  </a>
  <button
    v-if="!(props.to || props.href)"
    :class="classObject"
    :disabled="disabled ? 'disabled' : null"
    :title="title"
    @click="$emit('click')"
  >
    <p>
      <slot />
      <span
        v-if="props.icon"  
        v-html="Icons[props.icon]"
      />
    </p>
  </button>
</template>

<style scoped lang="scss">

button {
  appearance: none;
}

a {
  text-decoration: none;
}

a,
button {
  transition: all 150ms $ease;
  border-radius: 143px;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;

  &.-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: transparent;
    border-width: 0;
    appearance: none;
    padding: 0;
    border-radius: 15px;
    transition: all 250ms $ease;
    cursor: pointer;
    background-color: rgba(var(--theme-front-rgb), 0.05);

    p {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      padding: 5px 15px;
      font-weight: 600;
      font-size: 15px;
      color: rgba(var(--theme-front-rgb), 0.85);
    }

    &.-icon {
      span {
        display: inline-block;

        :deep(svg) {
          width: 12px;
          height: 12px;
          transform: translateY(-2px);
          vertical-align: middle;
        }
      }
    }

    &.-disabled {
      pointer-events: none;
      opacity: 0.35;
      cursor: default;
    }

    &:not(:disabled):hover {
      background-color: rgba(var(--theme-active-rgb), 0.1);
      
      p {
        color: var(--theme-active);
      }
    }

    &.-active {
      background-color: var(--theme-active);
      
      p {
        color: var(--theme-back);
      }
    }
  }

  &.-chunky {
    position: relative;
    background: linear-gradient(263.04deg, #F68A59 0%, #C86294 99.26%);
    box-shadow: 0 10px 20px -7px rgba(black, 0.25);

    p {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 3px rgba(black, 0.25);
    }

    &:before {
      position: absolute;
      content: '';
      display: block;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      transform: translate(-50%, -50%);
      border-radius: 100px;
      transition: opacity 250ms $ease;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(0deg, #F68A59 0%, #C86294 100%);
    }

    &.-icon {
      span {
        display: inline-block;

        :deep(svg) {
          width: 16px;
          height: 16px;
          transform: translateY(-2px);
          vertical-align: middle;
        }
      }
    }

    &.-tiny {
      p {
        padding-left: 15px;
        padding-right: 15px;
        @include r('font-size', 15, 15);
        line-height: 32px;
      }

      &.-icon.-e {
        p {
          padding-left: 14px;
          padding-right: 14px;
        }
      }
    }

    &.-small {
      p {
        padding-left: 25px;
        padding-right: 25px;
        @include r('font-size', 17, 17);
        line-height: 44px;
      }

      &.-icon.-e {
        p {
          padding-left: 14px;
          padding-right: 14px;
        }
      }
    }

    &.-medium {
      p {
        padding-left: 50px;
        padding-right: 50px;
        @include r('font-size', 24, 24);
        line-height: 60px;
      }

      &.-icon.-empty {
        p {
          padding-left: 22px;
          padding-right: 22px;
        }
      }
    }

    &.-large {
      
    }

    &.-disabled {
      pointer-events: none;
      opacity: 0.35;
      cursor: default;
    }

    &:not(:disabled):hover {
      box-shadow: 0 3px 5px -2px rgba(black, 0.5);
      text-shadow: 0 1px 2px rgba(black, 0.25);

      &:before {
        opacity: 1;
      }
    }
  }

  &.-outline {
    position: relative;
    background-color: transparent;
    border: 1px solid #F68A59;

    p {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 600;
      color: #F68A59;
    }

    &.-icon {
      span {
        display: inline-block;

        :deep(svg) {
          width: 16px;
          height: 16px;
          transform: translateY(-2px);
          vertical-align: middle;
        }
      }
    }

    &.-tiny {
      p {
        padding-left: 15px;
        padding-right: 15px;
        @include r('font-size', 15, 15);
        line-height: 32px;
      }

      &.-icon.-e {
        p {
          padding-left: 14px;
          padding-right: 14px;
        }
      }
    }

    &.-small {
      p {
        padding-left: 25px;
        padding-right: 25px;
        @include r('font-size', 17, 17);
        line-height: 44px;
      }

      &.-icon.-e {
        p {
          padding-left: 14px;
          padding-right: 14px;
        }
      }
    }

    &.-medium {
      p {
        padding-left: 50px;
        padding-right: 50px;
        @include r('font-size', 24, 24);
        line-height: 60px;
      }

      &.-icon.-empty {
        p {
          padding-left: 22px;
          padding-right: 22px;
        }
      }
    }

    &.-large {
      
    }

    &.-disabled {
      pointer-events: none;
      opacity: 0.35;
      cursor: default;
    }

    &:not(:disabled):hover {
      border-color: darken(#F68A59, 10);

      p {
        color: darken(#F68A59, 10);
      }
    }
  }
}

button {
  cursor: pointer;
}

@keyframes buttonHover {
  0% {
    transform: translate(-50%, -50%) scale(1.05, 1.05);
  }

  100% {
    transform: translate(-50%, -50%);
  }
}

</style>
