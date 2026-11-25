/*

The landscape behind the gm sky: a sky, two mountain ranges, hills with pine
trees and a dark foreground, drawn as SVG.

Every colour is a CSS variable set on the two SVG elements, so one palette
blend repaints the whole scene for any time of day. The variables live on the
SVGs and not on the page root: changing root variables makes the browser
restyle every sun on every frame.

 */

const NS = 'http://www.w3.org/2000/svg'
const SEED = 20261125

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function mk(tag, attrs, parent) {
  const element = document.createElementNS(NS, tag)
  for(const name in attrs) element.setAttribute(name, attrs[name])
  if(parent) parent.appendChild(element)
  return element
}

// Seeded random numbers, so the landscape looks the same on every visit.
function random(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const points = (list) => list.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')

// A jagged peak with a lighter face on each side. The face towards the sun
// gets shown, the other one fades.
function makePeak(r, px, base, w, h) {
  const wl = w * (0.75 + r() * 0.5)
  const wr = w * (0.75 + r() * 0.5)
  const steps = 4 + Math.floor(r() * 3)
  const top = base - h
  const left = []
  const right = []

  for(let i = 0; i <= steps; i++) {
    const t = i / steps
    let y = base - h * Math.pow(t, 1.3)
    if(i > 0 && i < steps) y += (r() - 0.5) * h * 0.16
    left.push([px - wl * (1 - t), y])
  }

  for(let i = steps; i >= 0; i--) {
    const t = i / steps
    let y = base - h * Math.pow(t, 1.3)
    if(i > 0 && i < steps) y += (r() - 0.5) * h * 0.16
    right.push([px + wr * (1 - t), y])
  }

  const outline = left.concat(right.slice(1))
  const k = Math.max(1, Math.round(steps * 0.3))
  const pl = left[k]
  const pr = right[right.length - 1 - k]

  const litLeft = left.slice(k).concat([
    [px + w * 0.04, top + h * 0.3],
    [pl[0] + (px - pl[0]) * 0.55 + (r() - 0.5) * w * 0.12, pl[1] - (pl[1] - top) * 0.12]
  ])
  const litRight = right.slice(0, right.length - k).concat([
    [pr[0] - (pr[0] - px) * 0.55 + (r() - 0.5) * w * 0.12, pr[1] - (pr[1] - top) * 0.12],
    [px - w * 0.04, top + h * 0.3]
  ])

  return { outline, litLeft, litRight, h }
}

function heightAt(outline, x) {
  if(x < outline[0][0] || x > outline[outline.length - 1][0]) return Infinity

  for(let i = 1; i < outline.length; i++) {
    const a = outline[i - 1]
    const b = outline[i]
    if(x <= b[0]) return a[1] + (b[1] - a[1]) * ((x - a[0]) / ((b[0] - a[0]) || 1))
  }

  return Infinity
}

function range(group, r, W, H, base, hMin, hMax, wMin, wMax, name) {
  const peaks = []
  let x = -wMax * 0.4

  while(x < W + wMax * 0.4) {
    const w = wMin + r() * (wMax - wMin)
    peaks.push(makePeak(r, x + w * 0.5, base, w, hMin + r() * (hMax - hMin)))
    x += w * (0.55 + r() * 0.5)
  }

  // Taller peaks behind
  peaks.sort((a, b) => b.h - a.h)

  mk('rect', { x: 0, y: base - 1, width: W, height: H - base + 1, style: `fill:var(--${name})` }, group)
  for(const peak of peaks) {
    mk('polygon', { points: points(peak.outline), style: `fill:var(--${name})` }, group)
    mk('polygon', { points: points(peak.litLeft), style: `fill:var(--${name}Lit);opacity:var(--litLeft)` }, group)
    mk('polygon', { points: points(peak.litRight), style: `fill:var(--${name}Lit);opacity:var(--litRight)` }, group)
  }

  return (x) => Math.min(base, ...peaks.map(peak => heightAt(peak.outline, x)))
}

function pine(x, y, h, r) {
  const tiers = 4 + Math.floor(r() * 3)
  const w = h * (0.32 + r() * 0.14)
  const th = h * 0.36
  const step = (h * 0.88 - th) / (tiers - 1)
  const f = (n) => n.toFixed(1)

  let d = `M${f(x - h * 0.025)},${f(y)}h${f(h * 0.05)}v${f(-h * 0.16)}h${f(-h * 0.05)}Z`

  for(let i = 0; i < tiers; i++) {
    const by = y - h * 0.12 - i * step
    const tw = w * (1 - (i / tiers) * 0.72)
    d += `M${f(x - tw / 2)},${f(by)}L${f(x - tw * 0.17)},${f(by - th * 0.14)}L${f(x)},${f(by - th)}L${f(x + tw * 0.17)},${f(by - th * 0.14)}L${f(x + tw / 2)},${f(by)}Z`
  }

  return d
}

function hills(group, r, W, H, base, amp, name, trees) {
  const waves = [0, 1, 2].map(() => ({
    f: (0.8 + r() * 2.6) * Math.PI * 2 / W,
    p: r() * 6.283,
    a: amp * (0.35 + r() * 0.65)
  }))
  const heightAt = (x) => base - waves.reduce((sum, wave) => sum + wave.a * Math.sin(wave.f * x + wave.p), 0)

  let d = `M0,${H}`
  for(let x = 0; x <= W + 8; x += 8) d += `L${x},${heightAt(x).toFixed(1)}`
  d += `L${W},${H}Z`

  if(trees) {
    for(let c = 0; c < trees.clusters; c++) {
      const cx = r() * W
      const count = 1 + Math.floor(r() * trees.per)
      for(let i = 0; i < count; i++) {
        const x = cx + (r() - 0.5) * trees.spread
        d += pine(x, heightAt(x) + 4, trees.hMin + r() * (trees.hMax - trees.hMin), r)
      }
    }
  }

  mk('path', { d, style: `fill:var(--${name})` }, group)
  return heightAt
}

// Draws the landscape into the two SVGs, sized to the window.
export function buildScene(heaven, land) {
  const W = window.innerWidth
  const H = window.innerHeight
  const r = random(SEED)
  const S = Math.max(W, 900)
  const scene = { heaven, land, W, H }

  heaven.innerHTML = ''
  land.innerHTML = ''
  for(const svg of [heaven, land]) svg.setAttribute('viewBox', `0 0 ${W} ${H}`)

  // Sky
  const defs = mk('defs', {}, heaven)
  const skyGradient = mk('linearGradient', { id: 'gm-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs)
  mk('stop', { offset: '0', style: 'stop-color:var(--top)' }, skyGradient)
  mk('stop', { offset: '.5', style: 'stop-color:var(--mid)' }, skyGradient)
  mk('stop', { offset: '.78', style: 'stop-color:var(--low)' }, skyGradient)
  const glowGradient = mk('radialGradient', { id: 'gm-glow' }, defs)
  mk('stop', { offset: '0', style: 'stop-color:var(--glow);stop-opacity:1' }, glowGradient)
  mk('stop', { offset: '1', style: 'stop-color:var(--glow);stop-opacity:0' }, glowGradient)
  const moonGradient = mk('radialGradient', { id: 'gm-moon' }, defs)
  mk('stop', { offset: '0', 'stop-color': '#dfe3ff', 'stop-opacity': '.35' }, moonGradient)
  mk('stop', { offset: '1', 'stop-color': '#dfe3ff', 'stop-opacity': '0' }, moonGradient)

  mk('rect', { width: W, height: H, fill: 'url(#gm-sky)' }, heaven)

  const stars = mk('g', { style: 'opacity:var(--stars)' }, heaven)
  for(let i = 0; i < 170; i++) {
    mk('circle', {
      cx: r() * W,
      cy: r() * H * 0.72,
      r: r() < 0.12 ? 1.5 : 0.75,
      fill: '#fff',
      class: r() < 0.35 ? 'twinkle' : '',
      style: `animation-delay:${(-r() * 4).toFixed(2)}s`
    }, stars)
  }

  scene.glow = mk('ellipse', { rx: W * 0.55, ry: H * 0.3, fill: 'url(#gm-glow)', style: 'opacity:var(--glowOp)' }, heaven)
  scene.halo = mk('circle', { r: 190, fill: 'url(#gm-glow)', style: 'opacity:.55' }, heaven)
  scene.sun = mk('circle', { r: 44, style: 'fill:var(--sun)' }, heaven)
  scene.moon = mk('g', {}, heaven)
  mk('circle', { r: 70, fill: 'url(#gm-moon)' }, scene.moon)
  mk('circle', { r: 22, fill: '#f3f1ff' }, scene.moon)
  mk('circle', { r: 19, cx: 9, cy: -6, style: 'fill:var(--top);opacity:.92' }, scene.moon)

  const clouds = mk('g', { style: 'fill:var(--cloud);opacity:var(--cloudOp)' }, heaven)
  for(let i = 0; i < 7; i++) {
    const group = mk('g', { class: 'cloud', style: `animation-duration:${(90 + r() * 90).toFixed(0)}s;animation-delay:${(-r() * 180).toFixed(0)}s` }, clouds)
    const cx = (i + r()) / 7 * W
    const cy = H * (0.12 + r() * 0.42)
    const count = 2 + Math.floor(r() * 3)
    for(let j = 0; j < count; j++) {
      const w = 50 + r() * 230
      const h = 5 + r() * 9
      mk('rect', { x: cx - w / 2 + (r() - 0.5) * 90, y: cy + j * (h + 4), width: w, height: h, rx: h / 2 }, group)
    }
  }

  // Land, back to front, with mist between the layers
  const landDefs = mk('defs', {}, land)
  const mist = mk('linearGradient', { id: 'gm-mist', x1: 0, y1: 0, x2: 0, y2: 1 }, landDefs)
  mk('stop', { offset: '0', style: 'stop-color:var(--mist);stop-opacity:0' }, mist)
  mk('stop', { offset: '.7', style: 'stop-color:var(--mist);stop-opacity:var(--mistOp)' }, mist)
  mk('stop', { offset: '1', style: 'stop-color:var(--mist);stop-opacity:0' }, mist)

  const far = range(mk('g', {}, land), r, W, H, H * 0.78, H * 0.09, H * 0.2, S * 0.1, S * 0.19, 'far')
  mk('rect', { x: 0, y: H * 0.62, width: W, height: H * 0.2, fill: 'url(#gm-mist)' }, land)
  const mid = range(mk('g', {}, land), r, W, H, H * 0.82, H * 0.05, H * 0.11, S * 0.05, S * 0.1, 'mtn')
  mk('rect', { x: 0, y: H * 0.68, width: W, height: H * 0.16, fill: 'url(#gm-mist)' }, land)
  const near = hills(mk('g', {}, land), r, W, H, H * 0.815, H * 0.022, 'hill1', { clusters: Math.round(W / 70), per: 6, spread: 70, hMin: 12, hMax: 32 })
  mk('rect', { x: 0, y: H * 0.77, width: W, height: H * 0.11, fill: 'url(#gm-mist)', style: 'opacity:.55' }, land)
  hills(mk('g', {}, land), r, W, H, H * 0.88, H * 0.028, 'hill2', { clusters: Math.round(W / 140), per: 5, spread: 110, hMin: 26, hMax: 66 })
  const front = hills(mk('g', {}, land), r, W, H, H * 0.955, H * 0.018, 'front', null)

  // Tall pines framing the edges
  let d = ''
  for(let i = 0; i < 5; i++) { const x = r() * W * 0.09; d += pine(x, front(x) + 6, H * (0.22 + r() * 0.2), r) }
  for(let i = 0; i < 5; i++) { const x = W - r() * W * 0.09; d += pine(x, front(x) + 6, H * (0.22 + r() * 0.2), r) }
  mk('path', { d, style: 'fill:var(--front)' }, land)

  const fireflies = mk('g', { style: 'opacity:var(--stars)' }, land)
  for(let i = 0; i < 26; i++) {
    mk('circle', {
      cx: r() * W,
      cy: H * (0.83 + r() * 0.15),
      r: 1.6,
      fill: '#ffeb8a',
      class: 'firefly',
      style: `animation-delay:${(-r() * 6).toFixed(2)}s;animation-duration:${(4 + r() * 5).toFixed(1)}s`
    }, fireflies)
  }

  // The skyline per pixel column, so suns can stay above it cheaply
  const skyline = new Float32Array(Math.ceil(W) + 1)
  for(let x = 0; x < skyline.length; x++) skyline[x] = Math.min(far(x), mid(x), near(x))
  scene.skyline = skyline

  return scene
}

// The highest point of the landscape between x0 and x1.
export function skyFloor(scene, x0, x1) {
  const line = scene.skyline
  const i0 = clamp(Math.round(x0), 0, line.length - 1)
  const i1 = clamp(Math.round(x1), 0, line.length - 1)
  let lowest = Infinity
  for(let i = i0; i <= i1; i += 2) if(line[i] < lowest) lowest = line[i]
  return Math.min(lowest, line[i1])
}

// Colours for nine moments of the day, blended in between.
// [hour, top, mid, low, glow, sun, far, farLit, mtn, mtnLit, mist, hill1, hill2, front, cloud, glowOp, mistOp, cloudOp, stars]
const COLORS = ['top', 'mid', 'low', 'glow', 'sun', 'far', 'farLit', 'mtn', 'mtnLit', 'mist', 'hill1', 'hill2', 'front', 'cloud']
const NUMBERS = ['glowOp', 'mistOp', 'cloudOp', 'stars']
const NIGHT = ['#070a1f', '#121741', '#262a5c', '#4a3f8a', '#fff1c4', '#1b2050', '#2a3170', '#141838', '#1c2250', '#303a7a', '#0f1230', '#0b0d25', '#06071a', '#2a3068', 0.15, 0.22, 0.35, 1]
export const PALETTE = [
  [0, ...NIGHT],
  [4.8, '#121640', '#2d2a66', '#6a4a82', '#c07a9a', '#ffd6b0', '#2e2c62', '#4a3f80', '#221f50', '#2f2a63', '#7a5a96', '#1c1942', '#141235', '#0b0a22', '#5a4a86', 0.3, 0.28, 0.45, 0.7],
  [6.3, '#3a4a9c', '#b47ab0', '#ffc0a0', '#ffd1a0', '#fff0d0', '#6c5aa4', '#e3a2c0', '#4b3e8a', '#9a6aa8', '#ffa8bc', '#7b3a80', '#55286a', '#2a1440', '#ffb6b0', 0.8, 0.4, 0.75, 0.08],
  [7.8, '#3f93c2', '#86c6d8', '#f4f1a6', '#fff7c2', '#fffbe0', '#5aaabd', '#a7dde2', '#2f8ba5', '#5fb4c4', '#d5f2ea', '#22768d', '#175d72', '#0d3a48', '#f6fdff', 0.65, 0.4, 0.8, 0],
  [12, '#2a78d2', '#6fb0ea', '#d4ecf8', '#ffffff', '#ffffff', '#86a9cc', '#b3cde6', '#5a8fb0', '#7fb0cc', '#e8f4fb', '#3e7e5e', '#2e6a4c', '#1b4532', '#ffffff', 0.25, 0.3, 0.9, 0],
  [15.5, '#3474c4', '#86b2e0', '#f2dcb0', '#fff0c8', '#fffbe6', '#8a9fc4', '#c8c4d8', '#6a86a8', '#a0a8c0', '#f6e6d0', '#4a7a52', '#376445', '#203f2c', '#fff6ea', 0.35, 0.3, 0.9, 0],
  [17.6, '#f39a1e', '#f9b234', '#ffd66a', '#fff0a0', '#ffe680', '#f0852a', '#f8a842', '#e0642a', '#ef7f30', '#ffbe50', '#b03c26', '#85221c', '#3a1014', '#ffcf5a', 0.9, 0.3, 0.8, 0],
  [18.8, '#2c2a6c', '#8c4e90', '#f2876a', '#ff9a6e', '#ffb38a', '#5c3c7e', '#a35c88', '#40296a', '#6a3a7a', '#d27a9c', '#2e1f50', '#231744', '#120c28', '#e08a9a', 0.7, 0.32, 0.7, 0.25],
  [20.5, '#0b0f2a', '#1a1d4e', '#34306a', '#5a4a90', '#fff1c4', '#20245a', '#2e3578', '#171b40', '#20265a', '#3a3f86', '#12153a', '#0d0f2c', '#07081e', '#33397a', 0.2, 0.24, 0.4, 0.9],
  [24, ...NIGHT]
]

const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const mix = (a, b, t) => {
  const x = rgb(a)
  const y = rgb(b)
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`
}

// The palette for an hour of the day, as { name: value }.
export function paletteAt(hour) {
  const h = ((hour % 24) + 24) % 24
  let i = PALETTE.findIndex(entry => entry[0] > h)
  if(i <= 0) i = 1
  const a = PALETTE[i - 1]
  const b = PALETTE[i]
  const t = (h - a[0]) / (b[0] - a[0])
  const result = {}

  COLORS.forEach((name, j) => { result[name] = mix(a[j + 1], b[j + 1], t) })
  NUMBERS.forEach((name, j) => {
    const k = COLORS.length + 1 + j
    result[name] = +(a[k] + (b[k] - a[k]) * t).toFixed(3)
  })

  return result
}

export const SUNRISE = 6
export const SUNSET = 18.8

export function isNight(hour) {
  return hour >= 18.5 || hour < 5
}

// Colours the scene and moves the sun and moon for an hour of the day.
export function applySky(scene, hour) {
  const h = ((hour % 24) + 24) % 24
  const colors = paletteAt(h)
  const set = (name, value) => {
    scene.heaven.style.setProperty('--' + name, value)
    scene.land.style.setProperty('--' + name, value)
  }

  for(const name in colors) set(name, colors[name])

  const { W, H } = scene
  const horizon = H * 0.78
  const day = (h - SUNRISE) / (SUNSET - SUNRISE)
  const visible = day >= -0.1 && day <= 1.1
  const sx = W * (0.06 + 0.88 * clamp(day, -0.1, 1.1))
  const sy = visible ? horizon - Math.sin(Math.PI * clamp(day, 0, 1)) * H * 0.58 + (day < 0 || day > 1 ? 60 : 0) : H * 1.3

  for(const element of [scene.sun, scene.halo]) {
    element.setAttribute('cx', sx.toFixed(1))
    element.setAttribute('cy', sy.toFixed(1))
  }
  scene.glow.setAttribute('cx', clamp(sx, 0, W).toFixed(1))
  scene.glow.setAttribute('cy', horizon.toFixed(1))

  const night = (((h - SUNSET) % 24) + 24) % 24 / (24 - (SUNSET - SUNRISE))
  const mx = W * (0.06 + 0.88 * night)
  const my = night <= 1 ? horizon - Math.sin(Math.PI * night) * H * 0.5 : H * 1.3
  scene.moon.setAttribute('transform', `translate(${mx.toFixed(1)},${my.toFixed(1)})`)

  const isDay = day >= 0 && day <= 1
  set('litLeft', isDay ? clamp(1.25 - 2 * day, 0.18, 1).toFixed(3) : '0.15')
  set('litRight', isDay ? clamp(2 * day - 0.75, 0.18, 1).toFixed(3) : '0.15')
}
