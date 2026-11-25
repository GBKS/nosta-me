import { DAY, activeGreeting, pileAt, statsAt, hash01 } from '@/helpers/gm/greetings.js'
import { skyFloor } from '@/helpers/gm/scene.js'

/*

Draws the suns and moons for one moment of time.

This works on the DOM directly rather than through Vue: during a replay
several hundred suns move on every frame. Suns are positioned with transforms
so moving them doesn't make the browser lay out the page again.

A sun's place comes from the age of its greeting at the moment shown: from
24 hours ago on the left to now on the right, along an arc like the real sun.

 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const TOP = 96

function geometry() {
  const W = window.innerWidth
  const H = window.innerHeight
  const horizon = H * 0.76
  return {
    W, H, horizon,
    top: TOP,
    left: Math.max(40, W * 0.05),
    right: W - Math.max(40, W * 0.05),
    arcHeight: (horizon - TOP) * 0.62,
    jitter: (horizon - TOP) * 0.34,
    scale: clamp(W / 1300, 0.62, 1)
  }
}

export function createRenderer({ container, getScene, profileOf, isFriend, onSelect, onHide }) {
  const views = new Map() // person key → view
  let wave = null

  function initial(pubkey) {
    const profile = profileOf(pubkey)
    const name = profile.name || ''
    return name.replace(/^[^\p{L}\p{N}]+/u, '').charAt(0).toUpperCase() || '☀'
  }

  function applyProfile(view) {
    const profile = profileOf(view.person.pubkey)
    const img = view.img
    if(profile.picture && img.getAttribute('src') != profile.picture) img.src = profile.picture
    view.initial.textContent = initial(view.person.pubkey)
    view.label.textContent = profile.name || view.person.pubkey.slice(0, 8) + '…'
  }

  function createView(person) {
    const el = document.createElement('div')
    el.className = 'gm-sun' + (person.type == 'gn' ? ' -moon' : '')
    el.style.display = 'none'
    el.innerHTML = '<div class="body"><div class="glow"></div><div class="rays"></div><div class="face"><span class="initial"></span><img alt="" referrerpolicy="no-referrer" loading="lazy"></div><div class="badge" hidden></div><div class="crescent"></div><div class="label"></div></div>'

    const view = {
      person, el,
      body: el.querySelector('.body'),
      img: el.querySelector('img'),
      initial: el.querySelector('.initial'),
      label: el.querySelector('.label'),
      badge: el.querySelector('.badge'),
      greeting: null,
      visible: false,
      pending: false,
      pile: -1,
      size: 30,
      x: 0,
      y: 0
    }

    view.img.onerror = () => view.img.removeAttribute('src')
    el.addEventListener('click', event => {
      event.stopPropagation()
      if(view.visible) onSelect(person)
    })
    if(isFriend(person.pubkey)) el.classList.add('-friend')

    applyProfile(view)
    container.appendChild(el)
    return view
  }

  function place(view, g, T) {
    const greeting = view.greeting
    const scene = getScene()
    const frac = clamp((greeting.t - (T - DAY)) / DAY, 0, 1)
    const x = g.left + frac * (g.right - g.left) + (hash01(greeting.id, 8) - 0.5) * 24
    const arc = Math.sin(Math.PI * clamp(frac, 0.03, 0.97))
    let y = g.horizon - 30 - arc * g.arcHeight + (greeting.j - 0.5) * g.jitter
    const floor = scene ? skyFloor(scene, x - view.size / 2, x + view.size / 2) : g.horizon
    y = clamp(y, g.top + view.size / 2, floor - view.size / 2 - 6)

    view.x = x
    view.y = y
    view.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`
    view.el.style.setProperty('--from', (g.H - y + view.size).toFixed(0) + 'px')
  }

  // Draws one person as they were at moment T. Someone who comes into view
  // rises from behind the hills: showing a hidden element restarts its CSS
  // animation.
  function draw(view, g, T, delay = 0) {
    if(view.pending) return

    const greeting = activeGreeting(view.person, T)
    if(!greeting) {
      if(view.visible) {
        view.el.style.display = 'none'
        view.visible = false
        onHide(view.person)
      }
      view.greeting = null
      return
    }

    const changed = greeting !== view.greeting
    view.greeting = greeting

    const pile = pileAt(greeting, T)
    if(pile !== view.pile || changed) {
      view.pile = pile
      view.size = Math.round(clamp(30 + 9 * Math.sqrt(pile), 30, 132) * g.scale)
      view.el.style.setProperty('--size', view.size + 'px')
      view.el.style.setProperty('--heat', clamp(pile / 24, 0, 1).toFixed(3))
      const stats = statsAt(greeting, T)
      view.badge.hidden = pile === 0
      view.badge.textContent = (stats.sats ? '⚡' : '+') + pile
      view.el.classList.toggle('-busy', pile >= 12)
    }

    place(view, g, T)

    if(!view.visible) {
      view.el.style.setProperty('--delay', delay.toFixed(3) + 's')
      view.el.style.display = ''
      view.visible = true
    } else if(changed) {
      // A newer greeting from the same person: rise again
      view.el.style.setProperty('--delay', '0s')
      for(const animation of view.body.getAnimations()) animation.currentTime = 0
    }
  }

  return {
    // A new person. While a wave is open, they wait and rise with the others.
    add(person, T) {
      const view = createView(person)
      views.set(person.key, view)
      if(wave) {
        view.pending = true
        wave.push(view)
      } else {
        draw(view, geometry(), T)
      }
      return view
    },

    // Redraw someone after their greetings or pile-ins changed.
    update(person, T) {
      const view = views.get(person.key)
      if(view) draw(view, geometry(), T)
    },

    // Collect everyone who arrives in the next moments, then let them rise
    // together from left to right.
    openWave() {
      wave = []
    },

    closeWave(T) {
      const list = wave || []
      wave = null
      const g = geometry()
      const ready = list
        .map(view => ({ view, greeting: activeGreeting(view.person, T) }))
        .sort((a, b) => (a.greeting ? a.greeting.t : 0) - (b.greeting ? b.greeting.t : 0))
      const step = Math.min(0.045, 3.2 / Math.max(1, ready.length))
      ready.forEach(({ view }, i) => {
        view.pending = false
        draw(view, g, T, i * step)
      })
    },

    // Draws everyone at moment T. Returns how many suns and moons are visible.
    render(T, { relayout = false } = {}) {
      const g = geometry()
      let gm = 0
      let gn = 0
      for(const view of views.values()) {
        if(relayout) view.pile = -1
        draw(view, g, T)
        if(view.visible) view.person.type == 'gm' ? gm++ : gn++
      }
      return { gm, gn }
    },

    profileChanged(pubkey) {
      for(const type of ['gm', 'gn']) {
        const view = views.get(type + ':' + pubkey)
        if(view) applyProfile(view)
      }
    },

    setSelected(key) {
      for(const view of views.values()) view.el.classList.toggle('-selected', view.person.key == key)
    },

    // Where a person is on screen, for placing the card next to them.
    viewOf(key) {
      return views.get(key) || null
    },

    clear() {
      views.clear()
      wave = null
      container.innerHTML = ''
    }
  }
}
