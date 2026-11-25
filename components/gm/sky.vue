<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSessionStore } from '@/stores/session'
import { DAY, createSky, addGreeting, greetingOf, pileFromEvent, addPile, statsAt } from '@/helpers/gm/greetings.js'
import { buildScene, applySky } from '@/helpers/gm/scene.js'
import { createLoader } from '@/helpers/gm/loader.js'
import { createRenderer } from '@/helpers/gm/renderer.js'
import analytics from '@/helpers/analytics.js'

/*

The gm sky: everyone who said gm in the last 24 hours as a sun, everyone who
said gn as a moon, over a landscape that follows the time of day. The replay
runs through the last 24 hours; a single clock (T, in seconds) says which
moment is on screen, and everything is drawn for that moment.

 */

const PLAY_SECONDS = 40

const sessionStore = useSessionStore()

const heaven = ref(null)
const land = ref(null)
const sunsElement = ref(null)

const audience = ref('all') // 'all' or 'follows'
const timeMode = ref('live') // 'live', 'scrub' or 'play'
const counts = ref({ gm: 0, gn: 0 })
const status = ref('')
const loadingYesterday = ref(false)
const sliderValue = ref(1440)
const timeLabel = ref('now')
const ticks = ref([])
const selected = shallowRef(null)
const anchor = ref(null)

const viewer = computed(() => sessionStore.isLoggedIn && sessionStore.publicKey ? sessionStore.publicKey : null)

const countText = computed(() => {
  const { gm, gn } = counts.value
  const text = gn ? `${gm} gm · ${gn} gn` : `${gm} gm`
  return text + (timeMode.value == 'live' ? ' today' : ' in these 24 h')
})

const legendText = computed(() => {
  if(audience.value == 'follows') return 'Suns are people you follow saying gm in the last 24 hours, moons are people saying gn.'
  return 'Suns are people on Nostr saying gm in the last 24 hours, moons are people saying gn.' + (viewer.value ? ' Blue rings are people you follow.' : '')
})

// Plain state, kept out of Vue's reactivity since it changes on every frame.
let sky = createSky()
let loader = null
let renderer = null
let scene = null
let generation = 0
let follows = new Set()
const profiles = new Map()
let T = Date.now() / 1000
let skyHour = hourAt(T)
let shownHour = -1
let renderedT = 0
let axisT = 0
let dirty = true
let frame = null
let lastFrame = 0
let selectedKey = null
let cardPile = -1

function hourAt(time) {
  const date = new Date(time * 1000)
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

function formatTime(time) {
  return new Date(time * 1000).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function profileOf(pubkey) {
  return profiles.get(pubkey) || {}
}

function storeProfile(event) {
  const old = profiles.get(event.pubkey)
  if(old && old.t >= event.created_at) return

  let content
  try {
    content = JSON.parse(event.content)
  } catch(error) {
    return
  }
  if(!content || typeof content != 'object') return

  const picture = typeof content.picture == 'string' && /^https:\/\//i.test(content.picture) ? content.picture : ''
  const name = [content.display_name, content.displayName, content.name].find(value => typeof value == 'string' && value.trim()) || ''

  profiles.set(event.pubkey, { name: name.trim().slice(0, 60), picture, t: event.created_at })
  if(renderer) renderer.profileChanged(event.pubkey)
  if(selected.value && selected.value.person.pubkey == event.pubkey) refreshCard(true)
}

function isFriend(pubkey) {
  return audience.value == 'all' && pubkey != viewer.value && follows.has(pubkey)
}

function onGreeting(event, gen) {
  if(gen != generation) return
  const added = addGreeting(sky, event)
  if(!added) return

  if(added.isNewPerson) renderer.add(added.person, T)
  else renderer.update(added.person, T)
}

function onPile(event, gen) {
  if(gen != generation) return
  const found = pileFromEvent(sky, event)
  if(!found || !addPile(found.greeting, found.pile)) return
  renderer.update(found.greeting.person, T)
}

function uniquePubkeys(greetings) {
  return [...new Set(greetings.map(greeting => greeting.person.pubkey))]
}

async function load() {
  const gen = ++generation
  if(loader) loader.close()
  loader = createLoader()
  sky = createSky()
  renderer.clear()
  select(null)
  counts.value = { gm: 0, gn: 0 }
  loadingYesterday.value = false

  const end = Math.floor(Date.now() / 1000)
  const start = end - DAY
  const start2 = end - 2 * DAY

  if(viewer.value && follows.size == 0) {
    status.value = 'Reading who you follow…'
    const contacts = await loader.loadContacts(viewer.value)
    if(gen != generation) return
    follows = new Set((contacts ? contacts.tags : []).filter(tag => tag[0] == 'p' && /^[0-9a-f]{64}$/.test(tag[1])).map(tag => tag[1]))
  }

  let authors = null
  if(audience.value == 'follows' && viewer.value) {
    authors = [...new Set([...follows, viewer.value])]
    status.value = `Looking for gm from ${authors.length} people…`
  } else {
    status.value = 'Looking for everyone who said gm…'
  }

  const accept = event => !!greetingOf(event)
  const handleGreeting = event => onGreeting(event, gen)
  const handlePile = event => onPile(event, gen)

  // The last 24 hours first. Everyone who arrives in the first moments
  // rises together, from left to right.
  renderer.openWave()
  const waveTimer = setTimeout(() => renderer.closeWave(T), 2600)
  await loader.loadGreetings({ since: start, until: end, authors, accept, onEvent: handleGreeting })
  if(gen != generation) return
  clearTimeout(waveTimer)
  renderer.closeWave(T)
  dirty = true

  if(sky.byId.size == 0) {
    status.value = authors ? 'Nobody you follow said gm in the last 24 hours. A quiet morning.' : "Couldn't find anyone saying gm. The relays may be having a moment."
    return
  }
  status.value = ''

  const firstIds = [...sky.byId.keys()]
  loader.loadProfiles(uniquePubkeys([...sky.byId.values()]), storeProfile)
  await loader.loadPiles(firstIds, start, handlePile)
  if(gen != generation) return

  // New greetings and pile-ins as they happen
  loader.listen({ since: Math.floor(Date.now() / 1000), authors, ids: firstIds, accept, onGreeting: handleGreeting, onPile: handlePile })

  // The day before, so the replay always has a full sky behind it
  loadingYesterday.value = true
  const known = new Set(firstIds)
  await loader.loadGreetings({ since: start2, until: start, authors, accept, onEvent: handleGreeting })
  if(gen != generation) return
  const newGreetings = [...sky.byId.values()].filter(greeting => !known.has(greeting.id))
  loader.loadProfiles(uniquePubkeys(newGreetings).filter(pubkey => !profiles.has(pubkey)), storeProfile)
  await loader.loadPiles(newGreetings.map(greeting => greeting.id), start2, handlePile)
  if(gen != generation) return
  loadingYesterday.value = false
  dirty = true
}

// Region labels along the horizon: roughly 8:00 local time in a few big
// regions (standard time offsets).
const REGIONS = [['Europe', 1], ['US East', -5], ['US West', -8], ['East Asia', 9], ['India', 5.5]]

function ticksAt(time) {
  const W = window.innerWidth
  const left = Math.max(40, W * 0.05)
  const right = W - left
  const start = time - DAY
  const result = [
    { x: left + 30, text: '24 h before', edge: true },
    { x: right - 20, text: timeMode.value == 'live' ? 'now' : 'this moment', edge: true }
  ]

  for(const [name, offset] of REGIONS) {
    let t = Math.floor(time / DAY) * DAY + (8 - offset) * 3600
    while(t > time) t -= DAY
    while(t < start) t += DAY
    if(t > time) continue
    const x = left + (t - start) / DAY * (right - left)
    result.push({ x, text: `☕ ${name} wakes` })
  }

  // Keep labels apart; on narrow screens some of them have to go
  const kept = result.slice(0, 2)
  for(const tick of result.slice(2).sort((a, b) => a.x - b.x)) {
    if(kept.every(other => Math.abs(other.x - tick.x) > (other.edge ? 110 : 120))) kept.push(tick)
  }

  return kept
}

function draw(relayout = false) {
  const visible = renderer.render(T, { relayout })
  if(visible.gm != counts.value.gm || visible.gn != counts.value.gn) counts.value = visible
  if(relayout || Math.abs(T - axisT) > 60) {
    ticks.value = ticksAt(T)
    axisT = T
  }
  if(selectedKey) refreshCard()
  renderedT = T
  dirty = false
}

function tick(timestamp) {
  const dt = Math.min(0.1, (timestamp - (lastFrame || timestamp)) / 1000)
  lastFrame = timestamp
  const now = Date.now() / 1000

  if(timeMode.value == 'live') {
    T = now
  } else if(timeMode.value == 'play') {
    T += dt * DAY / PLAY_SECONDS
    if(T >= now) {
      T = now
      setTimeMode('live')
    }
  }

  // Scrubbing jumps; the sky colours ease after it.
  const hour = hourAt(T)
  if(timeMode.value == 'scrub') {
    const difference = ((hour - skyHour + 36) % 24) - 12
    skyHour = (skyHour + difference * Math.min(1, dt * 6) + 24) % 24
  } else {
    skyHour = hour
  }

  if(Math.abs(skyHour - shownHour) > 0.0008) {
    applySky(scene, skyHour)
    shownHour = skyHour
  }

  if(dirty || Math.abs(T - renderedT) > (timeMode.value == 'live' ? 20 : 0.5)) draw()

  if(timeMode.value != 'scrub') sliderValue.value = Math.round(1440 - Math.min(DAY, now - T) / 60)
  timeLabel.value = timeMode.value == 'live' ? 'now' : formatTime(T)

  frame = requestAnimationFrame(tick)
}

function setTimeMode(mode) {
  timeMode.value = mode
  dirty = true
  axisT = 0
}

function onScrub(value) {
  if(timeMode.value != 'scrub') setTimeMode('scrub')
  sliderValue.value = value
  T = Date.now() / 1000 - (1440 - value) * 60
}

function onPlay() {
  if(timeMode.value == 'play') return setTimeMode('scrub')

  // From the start, unless paused somewhere in the middle
  if(Date.now() / 1000 - T < 600) T = Date.now() / 1000 - DAY
  setTimeMode('play')
  analytics.track('gm-replay')
}

function onLive() {
  setTimeMode('live')
}

function select(person) {
  if(!person) {
    selectedKey = null
    selected.value = null
    anchor.value = null
    if(renderer) renderer.setSelected(null)
    return
  }

  const isNew = person.key != selectedKey
  selectedKey = person.key
  renderer.setSelected(person.key)
  refreshCard(true)
  if(isNew) analytics.track('gm-card-open', { type: person.type })
}

// Keeps the card next to its sun and its numbers current.
function refreshCard(force = false) {
  const view = renderer.viewOf(selectedKey)
  if(!view || !view.visible || !view.greeting) return select(null)

  anchor.value = { x: view.x, y: view.y, size: view.size }

  if(force || view.pile != cardPile || !selected.value || selected.value.greeting !== view.greeting) {
    cardPile = view.pile
    selected.value = {
      person: view.person,
      greeting: view.greeting,
      stats: statsAt(view.greeting, T),
      profile: profileOf(view.person.pubkey)
    }
  }
}

function onHide(person) {
  if(person.key == selectedKey) select(null)
}

function setAudience(value) {
  if(value == audience.value) return
  audience.value = value
  analytics.track('gm-audience', { audience: value })
  load()
}

function onKey(event) {
  if(event.key == 'Escape') select(null)
}

let resizeTimer = null
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    scene = buildScene(heaven.value, land.value)
    applySky(scene, skyHour)
    draw(true)
  }, 120)
}

watch(viewer, () => {
  follows = new Set()
  if(!viewer.value) audience.value = 'all'
  if(renderer) load()
})

onMounted(() => {
  scene = buildScene(heaven.value, land.value)
  applySky(scene, skyHour)
  shownHour = skyHour

  renderer = createRenderer({
    container: sunsElement.value,
    getScene: () => scene,
    profileOf,
    isFriend,
    onSelect: select,
    onHide
  })

  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKey)
  frame = requestAnimationFrame(tick)
  load()
})

onBeforeUnmount(() => {
  generation++
  cancelAnimationFrame(frame)
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKey)
  if(loader) loader.close()
})
</script>

<template>
  <div class="gm-sky" :class="{ '-replay': timeMode != 'live' }" @click="select(null)">
    <svg ref="heaven" class="heaven" aria-hidden="true"></svg>
    <div ref="sunsElement" class="suns"></div>
    <svg ref="land" class="land" aria-hidden="true"></svg>
    <svg class="grain" aria-hidden="true">
      <filter id="gm-noise">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#gm-noise)" />
    </svg>
    <div class="axis" aria-hidden="true">
      <div
        v-for="tick in ticks"
        :key="tick.text"
        class="tick"
        :class="{ '-edge': tick.edge }"
        :style="{ left: tick.x + 'px' }"
      >{{ tick.text }}</div>
    </div>

    <div class="legend" @click.stop>
      <h1>{{ countText }}</h1>
      <p v-if="status" class="status">{{ status }}</p>
      <p class="explainer">{{ legendText }} Earlier on the left, now on the right. Bigger means more people piled in.</p>
      <div v-if="viewer" class="audience">
        <button :class="{ '-active': audience == 'all' }" @click="setAudience('all')">Everyone</button>
        <button :class="{ '-active': audience == 'follows' }" @click="setAudience('follows')">People I follow</button>
      </div>
    </div>

    <GmReplay
      :mode="timeMode"
      :value="sliderValue"
      :label="timeLabel"
      :loading="loadingYesterday"
      @scrub="onScrub"
      @play="onPlay"
      @live="onLive"
    />

    <GmCard
      v-if="selected && anchor"
      :data="selected"
      :anchor="anchor"
      @close="select(null)"
    />
  </div>
</template>

<style lang="scss">

// Not scoped: the suns and the landscape are made in code.
.gm-sky {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background-color: #070a1f;
  color: white;
  user-select: none;

  > .heaven,
  > .land,
  > .grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  > .heaven { z-index: 1; }
  > .suns { position: absolute; inset: 0; z-index: 2; }
  > .land { z-index: 3; }
  > .grain {
    z-index: 4;
    opacity: 0.1;
    mix-blend-mode: overlay;
  }

  .twinkle { animation: gm-twinkle 3.5s ease-in-out infinite alternate; }
  .cloud { animation: gm-drift 120s ease-in-out infinite alternate; }
  .firefly { animation: gm-firefly 6s ease-in-out infinite alternate; }

  > .axis {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 20vh;
    z-index: 5;
    pointer-events: none;
    font-size: 12px;

    .tick {
      position: absolute;
      top: 24%;
      transform: translateX(-50%);
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.78);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);

      &::before {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 100%;
        height: 10px;
        border-left: 1px dashed rgba(255, 255, 255, 0.4);
      }

      &.-edge::before {
        display: none;
      }
    }
  }

  > .legend {
    position: absolute;
    left: 16px;
    bottom: 18px;
    z-index: 10;
    max-width: 300px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(10, 14, 35, 0.42);
    backdrop-filter: blur(10px);
    font-size: 13px;
    line-height: 1.45;

    h1 {
      font-family: 'PoetsenOne';
      font-size: 22px;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    p {
      color: rgba(255, 255, 255, 0.85);
    }

    .status {
      color: #ffcf5c;
      margin-bottom: 4px;
    }

    .audience {
      display: flex;
      margin-top: 10px;
      padding: 3px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);

      button {
        flex: 1;
        border: 0;
        background: none;
        color: white;
        padding: 6px 10px;
        border-radius: 9px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        opacity: 0.75;

        &.-active {
          background: rgba(255, 255, 255, 0.9);
          color: #24160a;
          opacity: 1;
        }
      }
    }

    // Where the replay bar would cover it, the top left is free: the arc of
    // suns is low at the edges.
    @media (max-width: 1100px) {
      bottom: auto;
      top: 72px;
      max-width: 260px;
      font-size: 12px;
    }

    @include media-query(small) {
      left: 12px;
      right: 12px;
      max-width: none;
      padding: 8px 12px;

      .explainer {
        display: none;
      }

      h1 {
        font-size: 18px;
      }
    }
  }
}

// One sun or moon
.gm-sun {
  --size: 36px;
  --heat: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  cursor: pointer;
  transition:
    transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1),
    width 0.6s cubic-bezier(0.3, 1.6, 0.5, 1),
    height 0.6s cubic-bezier(0.3, 1.6, 0.5, 1),
    margin 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);

  .-replay & {
    // Moved on every frame, an easing would only lag behind
    transition:
      width 0.6s cubic-bezier(0.3, 1.6, 0.5, 1),
      height 0.6s cubic-bezier(0.3, 1.6, 0.5, 1),
      margin 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  &:hover,
  &.-selected {
    z-index: 50;
  }

  .body {
    position: absolute;
    inset: 0;
    animation: gm-rise 1.9s cubic-bezier(0.15, 0.85, 0.25, 1) both;
    animation-delay: var(--delay, 0s);
  }

  .rays {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    inset: calc(var(--size) * (-0.45 - var(--heat) * 0.75));
    background: repeating-conic-gradient(from 0deg, rgba(255, 214, 120, calc(0.22 + var(--heat) * 0.55)) 0 7deg, transparent 7deg 22deg);
    mask: radial-gradient(circle, transparent 30%, #000 34%, transparent 70%);
    animation: gm-spin calc(46s - var(--heat) * 38s) linear infinite;
  }

  .glow {
    position: absolute;
    inset: calc(var(--size) * (-0.35 - var(--heat) * 0.5));
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle, rgba(255, 196, 90, calc(0.45 + var(--heat) * 0.4)), rgba(255, 150, 60, 0) 68%);
  }

  .face {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    background: radial-gradient(circle at 35% 30%, #fff3c4, #ffc94a 55%, #ff9f2e);
    border: 2px solid #ffd76e;
    box-shadow: 0 0 calc(8px + var(--heat) * 34px) rgba(255, 190, 80, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
    display: grid;
    place-items: center;

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;

      &:not([src]) {
        display: none;
      }
    }
  }

  .initial {
    font-weight: 700;
    color: #8a4a00;
    font-size: calc(var(--size) * 0.42);
  }

  .badge {
    position: absolute;
    right: -6px;
    bottom: -4px;
    min-width: 20px;
    padding: 1px 6px;
    border-radius: 10px;
    background: #ff7a2e;
    color: white;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);

    &[hidden] {
      display: none;
    }
  }

  &:not(.-busy):not(:hover):not(.-selected) .badge {
    display: none;
  }

  .label {
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
    background: rgba(10, 14, 35, 0.6);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  &:hover .label,
  &.-selected .label {
    opacity: 1;
  }

  .crescent {
    display: none;
    position: absolute;
    top: -4px;
    right: -2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: -4px 3px 0 0 #f4f1ff;
    transform: rotate(-15deg);
    filter: drop-shadow(0 0 3px rgba(190, 205, 255, 0.9));
    pointer-events: none;
  }

  &.-friend .face {
    border-color: white;
    border-width: 3px;
    box-shadow: 0 0 calc(8px + var(--heat) * 34px) rgba(255, 190, 80, 0.95), 0 0 0 3px rgba(120, 200, 255, 0.85);
  }

  &.-moon {
    .crescent { display: block; }
    .rays { display: none; }
    .glow { background: radial-gradient(circle, rgba(170, 190, 255, calc(0.4 + var(--heat) * 0.45)), rgba(140, 160, 255, 0) 68%); }
    .face {
      background: radial-gradient(circle at 35% 30%, #ffffff, #dfe4ff 50%, #a9b3e6);
      border-color: #e6eaff;
      box-shadow: 0 0 calc(8px + var(--heat) * 30px) rgba(170, 190, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    }
    .initial { color: #3c4680; }
    .badge { background: #5a66b8; }
  }
}

@keyframes gm-rise {
  from { transform: translateY(var(--from, 300px)); }
  to { transform: none; }
}

@keyframes gm-spin {
  to { transform: rotate(360deg); }
}

@keyframes gm-twinkle {
  from { opacity: 0.25; }
  to { opacity: 1; }
}

@keyframes gm-drift {
  from { transform: translateX(-7vw); }
  to { transform: translateX(7vw); }
}

@keyframes gm-firefly {
  from { transform: translate(0, 0); }
  50% { transform: translate(10px, -14px); }
  to { transform: translate(-8px, -4px); }
}

@media (prefers-reduced-motion: reduce) {
  .gm-sun .rays,
  .gm-sky .cloud,
  .gm-sky .firefly,
  .gm-sky .twinkle {
    animation: none;
  }
}

</style>
