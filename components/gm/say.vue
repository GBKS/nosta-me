<script setup>

/*

The buttons for saying gm, and gn in the evening. Logged out, they lead to
the login, which comes back here afterwards.

 */

defineProps({
  loggedIn: Boolean,
  night: Boolean,   // show the gn button
  busy: String,     // 'gm' or 'gn' while signing and publishing
  muted: Boolean
})

const emit = defineEmits(['say', 'mute'])

const loginLink = { path: '/login/options', query: { next: '/gm' } }

function say(type, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  emit('say', type, { x: rect.left + rect.width / 2, y: rect.top })
}
</script>

<template>
  <div class="gm-say" @click.stop>
    <template v-if="loggedIn">
      <button class="say" :disabled="!!busy" @click="say('gm', $event)">
        {{ busy == 'gm' ? 'Saying gm…' : 'Say gm ☀️' }}
      </button>
      <button v-if="night" class="say -moon" :disabled="!!busy" @click="say('gn', $event)">
        {{ busy == 'gn' ? 'Saying gn…' : 'Say gn 🌙' }}
      </button>
    </template>
    <NuxtLink v-else class="say" :to="loginLink">Log in to say gm ☀️</NuxtLink>
    <button
      class="mute"
      :aria-label="muted ? 'Turn sound on' : 'Turn sound off'"
      :title="muted ? 'Sound off' : 'Sound on'"
      @click="emit('mute')"
    >{{ muted ? '🔇' : '🔊' }}</button>
  </div>
</template>

<style scoped lang="scss">

.gm-say {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: center;

  .say {
    padding: 14px 26px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 18px;
    font-weight: 800;
    border: 0;
    cursor: pointer;
    text-decoration: none;
    color: #4a2600;
    background: linear-gradient(180deg, #ffe08a, #ffb23e);
    box-shadow: 0 6px 24px rgba(255, 170, 60, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6);
    transition: transform 150ms $ease, opacity 150ms $ease;

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.97);
    }

    &:disabled {
      opacity: 0.7;
      cursor: default;
      transform: none;
    }

    &.-moon {
      color: #1f2558;
      background: linear-gradient(180deg, #f1f3ff, #a9b3ec);
      box-shadow: 0 6px 24px rgba(150, 165, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
  }

  .mute {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    cursor: pointer;
    font-size: 16px;
    background: rgba(10, 14, 35, 0.6);
  }

  @include media-query(small) {
    .say {
      padding: 12px 18px;
      font-size: 16px;
    }
  }
}

</style>
