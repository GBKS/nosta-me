<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'image'
])

const canvas = ref(null)
const pointerX = ref(50)
const pointerY = ref(50)
const pointerFromCenter = ref(0)
const backgroundX = ref(0)
const backgroundY = ref(0)
let direction = 'right'
let updateTimer

const classObject = computed(() => {
  const c = ['effect-card']

  return c.join(' ')
})

const cardStyle = computed(() => {
  return {
    backgroundImage: "url('" + props.image + "')",
    '--pointer-x': pointerX.value+'%',
    '--pointer-y': pointerY.value+'%',
    '--background-x': backgroundX.value+'%',
    '--background-y': backgroundY.value+'%'
  }
})

function update() {
  if(direction == 'left') {
    pointerX.value -= 0.25
    backgroundX.value -= 0.10
    backgroundY.value -= 0.05

    if(pointerX.value <= -100) direction = 'right'
  } else {
    pointerX.value += 0.25
    backgroundX.value += 0.10
    backgroundY.value += 0.05

    if(pointerX.value >= 100) direction = 'left'
  }
}

onMounted(() => {
  updateTimer = setInterval(update, 25)
})

onBeforeUnmount(() => {
  clearInterval(updateTimer)
})
</script>

<template>
  <div
    :class="classObject" 
    :style="cardStyle"
    ref="canvas"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
  >
    <div class="shine"></div>
    <div class="glare"></div>
    <slot />
  </div>
</template>

<style scoped lang="scss">

.effect-card {
  position: relative;
  height: 150px;
  border-radius: 15px;
  box-shadow: 0 15px 30px -10px rgba(black, 0.75);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  transform: translate3d(0px, 0px, 0.01px);

  --pointer-x: 25px;
  --pointer-y: 25px;
  --pointer-from-top: 0.5;
  --pointer-from-left: 0.5;
  --rotate-x: 0deg;
  --rotate-y: 0deg;
  --background-x: 50%;
  --background-y: 50%;
  --translate-x: 0px;
  --translate-y: 0px;
  --scanlines-space: 1px;
  --scanlines-light: #666;
  --scanlines-dark: black;
  --bars: 3%;
  --bar-color: hsla(0, 0%, 70%, 1);
  --bar-bg: hsla(0, 0%, 0%, 1);

  .shine,
  .shine:before,
  .shine:after,
  .glare,
  .glare:after {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border-radius: 15px;
  } 
  
  .shine:before,
  .shine:after,
  .glare:after {
    content: '';
  }

  .shine {
    background-image: repeating-linear-gradient( 110deg, var(--violet), var(--blue), var(--green), var(--yellow), var(--red), var(--violet), var(--blue), var(--green), var(--yellow), var(--red), var(--violet), var(--blue), var(--green), var(--yellow), var(--red) ), repeating-linear-gradient( 90deg, var(--scanlines-dark) calc(var(--scanlines-space) * 0), var(--scanlines-dark) calc(var(--scanlines-space) * 2), var(--scanlines-light) calc(var(--scanlines-space) * 2), var(--scanlines-light) calc(var(--scanlines-space) * 4) );
    background-position: calc(((50% - var(--background-x)) * 2.6) + 50%) calc(((50% - var(--background-y)) * 3.5) + 50%), center center;
    background-size: 400% 400%, cover;
    mix-blend-mode: color-dodge;
    background-blend-mode: overlay;
    filter: brightness(1.1) contrast(1.1) saturate(1.2);
  }
  
  .shine:before {
    background-image: repeating-linear-gradient( 90deg, var(--bar-bg) calc(var(--bars)*2), var(--bar-color) calc(var(--bars)*3), var(--bar-bg) calc(var(--bars)*3.5), var(--bar-color) calc(var(--bars)*4), var(--bar-bg) calc(var(--bars)*5), var(--bar-bg) calc(var(--bars)*14) ), repeating-linear-gradient( 90deg, var(--bar-bg) calc(var(--bars)*2), var(--bar-color) calc(var(--bars)*3), var(--bar-bg) calc(var(--bars)*3.5), var(--bar-color) calc(var(--bars)*4), var(--bar-bg) calc(var(--bars)*5), var(--bar-bg) calc(var(--bars)*10) );
    background-position: calc((((50% - var(--background-x)) * 1.65) + 50% ) + (var(--background-y) * 0.5)) var(--background-x), calc((((50% - var(--background-x)) * -0.9) + 50%) - (var(--background-y) * 0.75) ) var(--background-y);
    background-size: 200% 200%, 200% 200%;
    background-blend-mode: screen;
    filter: brightness( 1.15 ) contrast( 1.1 );
    mix-blend-mode: hard-light;
    // animation: shineBefore 60s linear infinite;
  }

  .shine:after {
    background-image: radial-gradient( farthest-corner circle at var(--pointer-x) var(--pointer-y), hsla(0, 0%, 90%, 0.8) 0%, hsla(0, 0%, 78%, 0.1) 25%, hsl(0, 0%, 0%) 90% );
    background-position: center center;
    background-size: cover;
    mix-blend-mode: luminosity;
    filter: brightness(0.6) contrast(4);
  }

  .glare {
    filter: brightness(0.8) contrast(1.5);
    mix-blend-mode: overlay;
    opacity: 0.8;
    background-image: radial-gradient( farthest-corner circle at var(--pointer-x) var(--pointer-y), hsla(0, 0%, 100%, 0.8) 10%, hsla(0, 0%, 100%, 0.65) 20%, hsla(0, 0%, 0%, 0.5) 90% );
    transform: translateZ(1.41px);
  }

  .glare:after {
    background-image: radial-gradient( farthest-corner circle at var(--pointer-x) var(--pointer-y), hsl(180, 100%, 95%) 5%, hsla(0, 0%, 39%, 0.25) 55%, hsla(0, 0%, 0%, 0.36) 110% );
    mix-blend-mode: overlay;
    filter: brightness(.6) contrast(3);
  }
}

@keyframes shine {
  0% {
    background-position: 0, 0;
  }
  
  100% {
    background-position: 110px, 150px;
  }
}

@keyframes shineBefore {
  0% {
    background-position: 0, 0;
  }
  
  100% {
    background-position: 110px, 150px;
  }
}

@keyframes point {
  0% {
    --pointer-x: 25px;
    --pointer-y: 25px;
  }
  
  50% {
    --pointer-x: 50px;
    --pointer-y: 75px;
  }
  
  100% {
    --pointer-x: 25px;
    --pointer-y: 25px;
  }
}

</style>
