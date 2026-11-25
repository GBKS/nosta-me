<script setup>

/*

Replays the last 24 hours: play runs through them in 40 seconds, the slider
jumps to any moment, live goes back to now.

 */

defineProps({
  mode: String,     // 'live', 'scrub' or 'play'
  value: Number,    // 0 (24 hours ago) to 1440 (now), in minutes
  label: String,
  loading: Boolean  // still loading the day before
})

const emit = defineEmits(['scrub', 'play', 'live'])

function onInput(event) {
  emit('scrub', Number(event.target.value))
}
</script>

<template>
  <div class="gm-replay" @click.stop>
    <button
      class="play"
      :aria-label="mode == 'play' ? 'Pause the replay' : 'Replay the last 24 hours'"
      :title="mode == 'play' ? 'Pause' : 'Replay the last 24 hours'"
      @click="emit('play')"
    >{{ mode == 'play' ? '❚❚' : '▶' }}</button>
    <input
      type="range"
      min="0"
      max="1440"
      step="1"
      :value="value"
      aria-label="Moment to show, from 24 hours ago to now"
      @input="onInput"
    >
    <span class="label">{{ label }}</span>
    <button class="live" :class="{ '-active': mode == 'live' }" @click="emit('live')">live</button>
    <span v-if="loading" class="loading">loading yesterday…</span>
  </div>
</template>

<style scoped lang="scss">

.gm-replay {
  position: absolute;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(10, 14, 35, 0.65);
  font-size: 13px;
  white-space: nowrap;

  button {
    border: 0;
    background: none;
    color: rgba(255, 255, 255, 0.65);
    cursor: pointer;
    padding: 0 2px;
    font-size: 13px;

    &:hover,
    &.-active {
      color: #ffcf5c;
    }
  }

  .play {
    font-size: 16px;
    color: #ffcf5c;
    width: 20px;
  }

  input {
    width: 200px;
    accent-color: #ffcf5c;
  }

  .label {
    min-width: 84px;
    font-variant-numeric: tabular-nums;
  }

  .loading {
    opacity: 0.6;
  }

  @include media-query(small) {
    left: 12px;
    right: 12px;
    transform: none;
    justify-content: center;

    input {
      width: auto;
      flex: 1;
      min-width: 80px;
    }

    .loading {
      display: none;
    }
  }
}

</style>
