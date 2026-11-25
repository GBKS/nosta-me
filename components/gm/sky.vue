<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSessionStore } from '@/stores/session'
import { DAY, createSky, addGreeting, greetingOf, pileFromEvent, addPile, statsAt, activeGreeting, removeGreeting, removePile, hasPiledIn } from '@/helpers/gm/greetings.js'
import { buildScene, applySky, isNight } from '@/helpers/gm/scene.js'
import { createLoader } from '@/helpers/gm/loader.js'
import { createRenderer } from '@/helpers/gm/renderer.js'
import { createEffects } from '@/helpers/gm/effects.js'
import { greetingTemplate, pileTemplate, sign, publishRelays, problemText } from '@/helpers/gm/publisher.js'
import * as sounds from '@/helpers/gm/sounds.js'
import analytics from '@/helpers/analytics.js'

/*

The gm sky: everyone who said gm in the last 24 hours as a sun, everyone who
said gn as a moon, over a landscape that follows the time of day. The replay
runs through the last 24 hours; a single clock (T, in seconds) says which
moment is on screen, and everything is drawn for that moment.

Logged in, you can say gm or gn yourself (a short note) and pile in on
someone's greeting (a reaction). Both show up in the sky right away and are
taken back if no relay accepts them.

 */

const PLAY_SECONDS = 40

const sessionStore = useSessionStore()

const root = ref(null)
const heaven = ref(null)
const land = ref(null)
const sunsElement = ref(null)
const starsElement = ref(null)
const cloudsElement = ref(null)
const firefliesElement = ref(null)
const grainElement = ref(null)

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
const busy = ref(null) // 'gm', 'gn' or 'pile' while signing and publishing
const muted = ref(false)
const night = ref(isNight(hourAt(Date.now() / 1000)))
const toast = ref('')

const viewer = computed(() => sessionStore.isLoggedIn && sessionStore.publicKey ? sessionStore.publicKey : null)

const countText = computed(() => {
  const { gm, gn } = counts.value
  const text = gn ? `${gm} gm · ${gn} gn` : `${gm} gm`
  return text + (timeMode.value == 'live' ? ' today' : ' in these 24 h')
})

// What the card's pile-in button can do for the selected greeting.
const pileState = computed(() => {
  const data = selected.value
  if(!data) return null
  if(!viewer.value) return 'login'
  if(data.person.pubkey == viewer.value) return 'mine'
  if(busy.value == 'pile') return 'busy'
  if(hasPiledIn(data.greeting, viewer.value)) return 'done'
  if(timeMode.value != 'live') return 'replay'
  return 'can'
})

const legendText = computed(() => {
  if(audience.value == 'follows') return 'Suns are people you follow saying gm in the last 24 hours, moons are people saying gn.'
  return 'Suns are people on Nostr saying gm in the last 24 hours, moons are people saying gn.' + (viewer.value ? ' Blue rings are people you follow.' : '')
})

// Plain state, kept out of Vue's reactivity since it changes on every frame.
let sky = createSky()
let loader = null
let renderer = null
let effects = null
let scene = null
let toastTimer = null
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

function isMine(pubkey) {
  return pubkey == viewer.value
}

function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 5000)
}

// Effects around a person's sun, if it's on screen.
function burstAt(person, sparks = 10) {
  const center = renderer.centerOf(person.key)
  if(!center) return
  effects.burst({ ...center, moon: person.type == 'gn', sparks })
}

function onGreeting(event, gen) {
  if(gen != generation) return
  const added = addGreeting(sky, event)
  if(!added) return

  if(added.isNewPerson) renderer.add(added.person, T)
  else renderer.update(added.person, T)
}

// A reaction or zap. One that arrives live flies in from the edge of the
// screen while the sun is in view.
function onPile(event, gen, live = false) {
  if(gen != generation) return
  const found = pileFromEvent(sky, event)
  if(!found) return
  const { greeting, pile } = found
  const person = greeting.person
  const view = renderer.viewOf(person.key)

  if(!live || timeMode.value != 'live' || !view || !view.visible || view.greeting !== greeting) {
    if(addPile(greeting, pile)) renderer.update(person, T)
    return
  }

  // Taken now, so the same reaction can't fly in twice
  if(!pile.zap) greeting.reactors.add(pile.pubkey)
  const fromLeft = Math.random() < 0.5
  effects.flyIn({
    from: { x: fromLeft ? -30 : window.innerWidth + 30, y: 96 + Math.random() * window.innerHeight * 0.4 },
    to: () => renderer.centerOf(person.key) || { x: view.x, y: view.y },
    picture: profileOf(pile.pubkey).picture,
    duration: 1300
  }).then(() => {
    greeting.piles.push(pile)
    greeting.orbit.push({ pubkey: pile.pubkey, t: pile.t })
    renderer.update(person, T)
    if(selectedKey == person.key) refreshCard(true)
    burstAt(person)
    sounds.chime(statsAt(greeting, T).people, 0.05, person.type == 'gn')
  })
}

// Says gm or gn: shows it in the sky at once, then publishes it.
async function say(type, from) {
  if(busy.value || !viewer.value) return

  if(timeMode.value != 'live') {
    setTimeMode('live')
    T = Date.now() / 1000
    draw()
  }

  // Already said it in the last half day: the sun just lights up
  const key = type + ':' + viewer.value
  const person = sky.people.get(key)
  const recent = person && activeGreeting(person, T)
  if(recent && T - recent.t < DAY / 2) {
    burstAt(person, 14)
    sounds.chime(6, 0.1, type == 'gn')
    showToast(`You already said ${type} today. Your ${type == 'gn' ? 'moon' : 'sun'} says hi.`)
    return
  }

  busy.value = type
  let event
  try {
    event = await sign(greetingTemplate(type))
  } catch(error) {
    busy.value = null
    showToast(problemText(error.message))
    return
  }

  const added = addGreeting(sky, event)
  if(!added) {
    busy.value = null
    return
  }

  if(added.isNewPerson) renderer.add(added.person, T, { slow: true })
  else renderer.update(added.person, T, { slow: true })
  effects.glow(type)
  if(type == 'gn') sounds.moonrise()
  else sounds.sunrise()
  setTimeout(() => burstAt(added.person, 18), 2400)
  analytics.track('gm-say', { type })

  const accepted = await publish(event)
  busy.value = null

  if(accepted == 0) {
    removeGreeting(sky, added.greeting)
    renderer.update(added.person, T)
    showToast(problemText('no-relay'))
  }
}

// Piles in on the selected greeting: your avatar flies onto it, then the
// reaction gets published.
async function pileIn(from) {
  const view = renderer.viewOf(selectedKey)
  if(busy.value || !viewer.value || !view || !view.greeting) return

  const greeting = view.greeting
  const person = view.person
  if(hasPiledIn(greeting, viewer.value)) return

  busy.value = 'pile'
  let event
  try {
    event = await sign(pileTemplate(greeting.event, person.type))
  } catch(error) {
    busy.value = null
    showToast(problemText(error.message))
    return
  }

  // Taken now, so the reaction coming back from a relay doesn't count twice
  greeting.reactors.add(viewer.value)
  const pile = { id: event.id, t: event.created_at, pubkey: viewer.value, zap: false, sats: 0 }
  const publishing = publish(event)
  analytics.track('gm-back', { type: person.type })

  await effects.flyIn({
    from,
    to: () => renderer.centerOf(person.key) || { x: view.x, y: view.y },
    picture: profileOf(viewer.value).picture,
    duration: 850
  })
  greeting.piles.push(pile)
  greeting.orbit.push({ pubkey: viewer.value, t: pile.t })
  renderer.update(person, T)
  if(selectedKey == person.key) refreshCard(true)
  burstAt(person)
  sounds.chime(statsAt(greeting, T).people, 0.14, person.type == 'gn')

  const accepted = await publishing
  busy.value = null
  if(accepted == 0) {
    removePile(greeting, pile)
    greeting.orbit = greeting.orbit.filter(entry => entry.pubkey != viewer.value || entry.t != pile.t)
    renderer.update(person, T)
    showToast(problemText('no-relay'))
  }
  refreshCard(true)
}

// How many relays accepted the event; 0 if something went wrong on the way.
async function publish(event) {
  try {
    return await loader.publish(publishRelays(), event)
  } catch(error) {
    return 0
  }
}

function toggleMute() {
  muted.value = !muted.value
  sounds.setMuted(muted.value)
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
  const handleLivePile = event => onPile(event, gen, true)

  // Your own picture, for your sun and for piling in
  if(viewer.value && !profiles.has(viewer.value)) loader.loadProfiles([viewer.value], storeProfile)

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
  loader.listen({ since: Math.floor(Date.now() / 1000), authors, ids: firstIds, accept, onGreeting: handleGreeting, onPile: handleLivePile })

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
    // Whether to offer gn goes by your own clock, not the replay's
    const nightNow = isNight(hourAt(now))
    if(nightNow != night.value) night.value = nightNow
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
    scene = buildScene(heaven.value, land.value, layers())
    applySky(scene, skyHour)
    draw(true)
  }, 120)
}

watch(viewer, () => {
  follows = new Set()
  if(!viewer.value) audience.value = 'all'
  if(renderer) load()
})

function layers() {
  return { stars: starsElement.value, clouds: cloudsElement.value, fireflies: firefliesElement.value }
}

// Film grain as a small tiled image. A noise filter blended over the page
// would make the browser blend every pixel again on every frame.
function makeGrain() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const image = context.createImageData(size, size)
  for(let i = 0; i < image.data.length; i += 4) {
    const light = Math.random() < 0.5 ? 255 : 0
    image.data[i] = light
    image.data[i + 1] = light
    image.data[i + 2] = light
    image.data[i + 3] = Math.random() * 12
  }
  context.putImageData(image, 0, 0)
  grainElement.value.style.backgroundImage = `url(${canvas.toDataURL()})`
}

onMounted(() => {
  muted.value = sounds.isMuted()
  effects = createEffects(root.value)
  makeGrain()
  scene = buildScene(heaven.value, land.value, layers())
  applySky(scene, skyHour)
  shownHour = skyHour

  renderer = createRenderer({
    container: sunsElement.value,
    getScene: () => scene,
    profileOf,
    isFriend,
    isMine,
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
  clearTimeout(toastTimer)
  if(loader) loader.close()
})
</script>

<template>
  <div ref="root" class="gm-sky" :class="{ '-replay': timeMode != 'live' }" @click="select(null)">
    <svg ref="heaven" class="heaven" aria-hidden="true"></svg>
    <div ref="starsElement" class="stars" aria-hidden="true"></div>
    <div ref="cloudsElement" class="clouds" aria-hidden="true"></div>
    <div ref="sunsElement" class="suns"></div>
    <svg ref="land" class="land" aria-hidden="true"></svg>
    <div ref="firefliesElement" class="fireflies" aria-hidden="true"></div>
    <div ref="grainElement" class="grain" aria-hidden="true"></div>
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

    <GmSay
      :logged-in="!!viewer"
      :night="night"
      :busy="busy == 'gm' || busy == 'gn' ? busy : null"
      :muted="muted"
      @say="say"
      @mute="toggleMute"
    />

    <Transition name="gm-toast">
      <p v-if="toast" class="toast" role="status">{{ toast }}</p>
    </Transition>

    <GmCard
      v-if="selected && anchor"
      :data="selected"
      :anchor="anchor"
      :pile="pileState"
      @close="select(null)"
      @pile="pileIn"
      @live="onLive"
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
  > .stars,
  > .clouds,
  > .land,
  > .fireflies,
  > .grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  // Back to front; later siblings with the same z-index sit on top
  > .heaven,
  > .stars,
  > .clouds { z-index: 1; }
  > .suns { position: absolute; inset: 0; z-index: 2; }
  > .land,
  > .fireflies { z-index: 3; }
  > .grain { z-index: 4; }

  > .stars {
    opacity: var(--stars);

    .star-set {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;

      & + .star-set {
        animation: gm-twinkle 3.5s ease-in-out infinite alternate;
        will-change: opacity;
      }
    }
  }

  > .clouds {
    opacity: var(--cloudOp);

    .cloud {
      position: absolute;
      animation: gm-drift 120s ease-in-out infinite alternate;
      will-change: transform;

      div {
        position: absolute;
        background-color: var(--cloud);
      }
    }
  }

  > .fireflies {
    opacity: var(--stars);

    .firefly {
      position: absolute;
      width: 3px;
      height: 3px;
      margin: -1.5px 0 0 -1.5px;
      border-radius: 50%;
      background-color: #ffeb8a;
      box-shadow: 0 0 6px #ffeb8a;
      animation: gm-firefly 6s ease-in-out infinite alternate;
      will-change: transform;
    }
  }

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
      top: 8%;
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
    // No backdrop blur: it would blur the moving sky again on every frame
    background: rgba(10, 14, 35, 0.6);
    font-size: 13px;
    line-height: 1.45;

    h1 {
      color: white;
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
  // Its own GPU layer, so a replay moves suns without repainting them
  will-change: transform;
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

  // A drawn image rather than a masked gradient, and only busy suns spin:
  // hundreds of spinning masks kept the GPU busy all the time.
  .rays {
    position: absolute;
    pointer-events: none;
    inset: calc(var(--size) * (-0.45 - var(--heat) * 0.75));
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-50 -50 100 100'%3E%3CradialGradient id='f' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='50'%3E%3Cstop offset='0' stop-color='%23ffd678' stop-opacity='0'/%3E%3Cstop offset='.4' stop-color='%23ffd678' stop-opacity='0'/%3E%3Cstop offset='.48' stop-color='%23ffd678' stop-opacity='.95'/%3E%3Cstop offset='.97' stop-color='%23ffd678' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath fill='url(%23f)' d='M0 0L50.0 0.0A50 50 0 0 1 49.6 6.1ZM0 0L46.2 19.1A50 50 0 0 1 43.5 24.6ZM0 0L35.4 35.4A50 50 0 0 1 30.8 39.4ZM0 0L19.1 46.2A50 50 0 0 1 13.4 48.2ZM0 0L0.0 50.0A50 50 0 0 1 -6.1 49.6ZM0 0L-19.1 46.2A50 50 0 0 1 -24.6 43.5ZM0 0L-35.4 35.4A50 50 0 0 1 -39.4 30.8ZM0 0L-46.2 19.1A50 50 0 0 1 -48.2 13.4ZM0 0L-50.0 0.0A50 50 0 0 1 -49.6 -6.1ZM0 0L-46.2 -19.1A50 50 0 0 1 -43.5 -24.6ZM0 0L-35.4 -35.4A50 50 0 0 1 -30.8 -39.4ZM0 0L-19.1 -46.2A50 50 0 0 1 -13.4 -48.2ZM0 0L-0.0 -50.0A50 50 0 0 1 6.1 -49.6ZM0 0L19.1 -46.2A50 50 0 0 1 24.6 -43.5ZM0 0L35.4 -35.4A50 50 0 0 1 39.4 -30.8ZM0 0L46.2 -19.1A50 50 0 0 1 48.2 -13.4Z'/%3E%3C/svg%3E") center / contain no-repeat;
    opacity: calc(0.3 + var(--heat) * 0.6);
  }

  &.-busy .rays {
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

// Your own sun or moon
.gm-sun.-mine .face {
  border-color: white;
  border-width: 4px;
}

.gm-sun.-mine {
  z-index: 40;
}

// Saying gm: a proper sunrise
.gm-sun.-slow .body {
  animation-duration: 3s;
}

// Avatars of people who piled in while the page was open
.gm-sun .orbit {
  position: absolute;
  inset: calc(var(--size) * -0.32 - 8px);
  animation: gm-spin 7s linear infinite;
  pointer-events: none;

  &:empty {
    display: none;
  }

  .satellite {
    position: absolute;
    left: 50%;
    top: 0;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border-radius: 50%;
    background: #ffd76e center / cover;
    border: 1.5px solid white;
    transform-origin: 8px calc(50% + 8px);
  }
}

.gm-sky {
  .gm-flyer {
    position: absolute;
    left: 0;
    top: 0;
    width: 26px;
    height: 26px;
    margin: -13px 0 0 -13px;
    border-radius: 50%;
    z-index: 15;
    background: #ffd76e center / cover;
    border: 2px solid white;
    box-shadow: 0 0 14px rgba(255, 200, 90, 0.9);
    pointer-events: none;
  }

  .gm-ring {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 50%;
    border: 3px solid rgba(255, 220, 140, 0.95);
    pointer-events: none;
    z-index: 14;

    &.-moon {
      border-color: rgba(195, 208, 255, 0.95);
    }
  }

  .gm-spark {
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 6px;
    margin: -3px;
    border-radius: 50%;
    background: #fff3b0;
    box-shadow: 0 0 8px #ffd25e;
    pointer-events: none;
    z-index: 14;
  }

  .gm-flash {
    position: absolute;
    inset: 0;
    z-index: 4;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 85%, rgba(255, 210, 130, 0.9), rgba(255, 150, 90, 0.35) 45%, transparent 75%);

    &.-moon {
      background: radial-gradient(ellipse at 50% 85%, rgba(175, 190, 255, 0.75), rgba(110, 120, 220, 0.3) 45%, transparent 75%);
    }
  }

  > .toast {
    position: absolute;
    left: 50%;
    bottom: 186px;
    transform: translateX(-50%);
    z-index: 12;
    max-width: calc(100% - 24px);
    padding: 10px 16px;
    border-radius: 14px;
    background: rgba(10, 14, 35, 0.8);
    color: white;
    font-size: 14px;
    text-align: center;
  }
}

.gm-toast-enter-active,
.gm-toast-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}

.gm-toast-enter-from,
.gm-toast-leave-to {
  opacity: 0;
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
  .gm-sun .orbit,
  .gm-sky .cloud,
  .gm-sky .firefly,
  .gm-sky .star-set {
    animation: none;
  }
}

</style>
