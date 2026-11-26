<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { greetingOf } from '@/helpers/gm/greetings.js'
import { createLoader } from '@/helpers/gm/loader.js'
import { paletteAt } from '@/helpers/gm/scene.js'
import analytics from '@/helpers/analytics.js'

/*

A small window onto /gm on the home page: the people who said gm or gn in the
last few hours rise as little suns and moons over hills in the colours of
the time of day. It only reads from relays once it scrolls into view.

 */

const HOURS = 3
const SHOWN = 14

const element = ref(null)
const people = ref([]) // newest first: { pubkey, type, picture }
const total = ref(null)

const hour = new Date().getHours() + new Date().getMinutes() / 60
const colors = paletteAt(hour)

const skyStyle = computed(() => ({
  background: `linear-gradient(to bottom, ${colors.top}, ${colors.mid} 60%, ${colors.low})`
}))

const headline = computed(() => {
  if(total.value === null) return 'Who said gm today?'
  if(total.value == 0) return 'Be the first to say gm'
  return total.value == 1 ? '1 person said gm lately' : `${total.value} people said gm lately`
})

const subline = computed(() => {
  if(total.value) return `In the last ${HOURS} hours on Nostr. Come say it back.`
  return 'Everyone on Nostr who said gm today, as a sky full of suns.'
})

// Placed along an arc: oldest on the left, newest on the right.
const suns = computed(() => {
  // Fewer on narrow screens, so they stay clear of the text
  const shown = window.innerWidth < 600 ? 9 : SHOWN
  const list = people.value.slice(0, shown).reverse()
  const count = list.length
  return list.map((person, i) => {
    const t = count == 1 ? 0.5 : i / (count - 1)
    const x = 8 + t * 84
    // The arc stays in the top half; the text sits below it
    const y = 50 - Math.sin(Math.PI * (0.08 + t * 0.84)) * 36 + ((i * 37) % 9) - 4
    return {
      ...person,
      style: {
        left: x + '%',
        top: y + '%',
        animationDelay: (i * 0.12).toFixed(2) + 's',
        backgroundImage: person.picture ? `url("${person.picture.replace(/"/g, '%22')}")` : ''
      }
    }
  })
})

let loader = null
let observer = null

async function load() {
  loader = createLoader()
  const until = Math.floor(Date.now() / 1000)
  const found = new Map()

  await loader.loadGreetings({
    since: until - HOURS * 3600,
    until,
    authors: null,
    accept: event => !!greetingOf(event),
    onEvent: event => {
      const old = found.get(event.pubkey)
      if(!old || event.created_at > old.t) found.set(event.pubkey, { pubkey: event.pubkey, type: greetingOf(event), t: event.created_at })
    }
  })
  if(!loader) return

  // The headline says gm, so only gm counts; moons still show
  total.value = [...found.values()].filter(person => person.type == 'gm').length
  const newest = [...found.values()].sort((a, b) => b.t - a.t)

  // Faces make it: look up more people than shown and prefer those with a picture.
  const candidates = newest.slice(0, SHOWN * 2)
  const pictures = new Map()
  await loader.loadProfiles(candidates.map(person => person.pubkey), event => {
    try {
      const content = JSON.parse(event.content)
      if(typeof content.picture == 'string' && /^https:\/\//i.test(content.picture)) pictures.set(event.pubkey, content.picture)
    } catch(error) {
      // Not a profile we can read
    }
  })
  if(!loader) return

  const withPicture = candidates.filter(person => pictures.has(person.pubkey))
  const without = candidates.filter(person => !pictures.has(person.pubkey))
  people.value = withPicture.concat(without).slice(0, SHOWN).map(person => ({ ...person, picture: pictures.get(person.pubkey) || '' }))
}

function onOpen() {
  analytics.track('gm-open', { from: 'home' })
}

onMounted(() => {
  observer = new IntersectionObserver(entries => {
    if(entries.some(entry => entry.isIntersecting)) {
      observer.disconnect()
      observer = null
      load()
    }
  }, { rootMargin: '200px' })
  // The ref is the NuxtLink component; observe its element
  observer.observe(element.value.$el || element.value)
})

onBeforeUnmount(() => {
  if(observer) observer.disconnect()
  if(loader) loader.close()
  loader = null
})
</script>

<template>
  <NuxtLink ref="element" to="/gm" class="home-gm" :style="skyStyle" @click="onOpen">
    <div class="sky" aria-hidden="true">
      <div
        v-for="sun in suns"
        :key="sun.pubkey"
        class="sun"
        :class="{ '-moon': sun.type == 'gn' }"
        :style="sun.style"
      ></div>
    </div>
    <svg class="hills" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
      <path :fill="colors.far" d="M0 50 L120 20 L210 48 L330 8 L450 46 L560 18 L680 50 L800 12 L900 40 L1000 22 L1000 120 L0 120Z" />
      <path :fill="colors.hill1" d="M0 80 C 180 50, 330 95, 520 70 S 850 55, 1000 78 L1000 120 L0 120Z" />
      <path :fill="colors.front" d="M0 104 C 220 86, 420 112, 640 98 S 900 92, 1000 102 L1000 120 L0 120Z" />
    </svg>
    <div class="text">
      <h2>{{ headline }}</h2>
      <p>{{ subline }}</p>
      <span class="button">See the gm sky ☀️</span>
    </div>
  </NuxtLink>
</template>

<style scoped lang="scss">

.home-gm {
  position: relative;
  display: block;
  width: 100%;
  max-width: 900px;
  margin-top: 60px;
  @include r('height', 340, 360);
  border-radius: 25px;
  overflow: hidden;
  text-decoration: none;
  color: white;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transition: transform 200ms $ease, box-shadow 200ms $ease;

  &:hover {
    transform: scale(1.01);
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.2);

    .button {
      transform: scale(1.05);
    }
  }

  .sky {
    position: absolute;
    inset: 0;
  }

  .sun {
    position: absolute;
    width: 38px;
    height: 38px;
    margin: -19px 0 0 -19px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff3c4, #ffc94a 55%, #ff9f2e) center / cover;
    border: 2px solid #ffd76e;
    box-shadow: 0 0 18px rgba(255, 190, 80, 0.9);
    animation: home-gm-rise 1.6s cubic-bezier(0.15, 0.85, 0.25, 1) both;

    &.-moon {
      width: 32px;
      height: 32px;
      margin: -16px 0 0 -16px;
      border-color: #e6eaff;
      background-color: #dfe4ff;
      box-shadow: 0 0 16px rgba(170, 190, 255, 0.95);
    }
  }

  .hills {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 34%;
  }

  .text {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 20px;
    text-align: center;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);

    h2 {
      font-family: 'PoetsenOne';
      @include r('font-size', 26, 34);
      line-height: 1.1;
      color: white;
    }

    p {
      font-weight: 600;
      @include r('font-size', 14, 16);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .button {
    margin-top: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    font-weight: 800;
    color: #4a2600;
    text-shadow: none;
    background: linear-gradient(180deg, #ffe08a, #ffb23e);
    box-shadow: 0 6px 20px rgba(255, 170, 60, 0.4);
    transition: transform 200ms $ease;
  }
}

@keyframes home-gm-rise {
  from {
    transform: translateY(160px);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-gm .sun {
    animation: none;
  }
}

</style>
