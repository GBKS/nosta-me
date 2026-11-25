/*

The moments on the gm sky: an avatar flying onto a sun, a burst of light
when it lands, and the sky lighting up when you say gm. Everything is a
short-lived element animated with the Web Animations API, which runs on the
GPU and removes nothing it didn't add.

 */

function element(root, className) {
  const el = document.createElement('div')
  el.className = className
  root.appendChild(el)
  return el
}

const backgroundFor = (picture) => picture ? `url("${picture.replace(/"/g, '%22')}")` : ''

export function createEffects(root) {
  const flash = element(root, 'gm-flash')

  return {
    // Flies an avatar from `from` onto whatever `to()` returns when it lands.
    // Resolves when it arrived.
    flyIn({ from, to, picture, duration = 900 }) {
      return new Promise(resolve => {
        const flyer = element(root, 'gm-flyer')
        flyer.style.backgroundImage = backgroundFor(picture)
        const target = to()
        const middle = {
          x: (from.x + target.x) / 2 + (Math.random() - 0.5) * 240,
          y: Math.min(from.y, target.y) - 90 - Math.random() * 120
        }

        const animation = flyer.animate([
          { transform: `translate(${from.x}px, ${from.y}px) scale(0.7)` },
          { transform: `translate(${middle.x}px, ${middle.y}px) scale(1.15)`, offset: 0.5 },
          { transform: `translate(${target.x}px, ${target.y}px) scale(0.4)` }
        ], { duration, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' })

        animation.onfinish = () => {
          flyer.remove()
          resolve()
        }
        animation.oncancel = animation.onfinish
      })
    },

    // A ring and sparks around a sun, and the sun itself pops.
    burst({ x, y, size, moon = false, sparks = 10, face = null }) {
      const ring = element(root, 'gm-ring' + (moon ? ' -moon' : ''))
      ring.style.width = ring.style.height = size + 'px'
      const at = `translate(${x - size / 2}px, ${y - size / 2}px)`
      ring.animate([
        { transform: at + ' scale(0.8)', opacity: 1 },
        { transform: at + ' scale(2.6)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }).onfinish = () => ring.remove()

      for(let i = 0; i < sparks; i++) {
        const spark = element(root, 'gm-spark')
        const angle = (i / sparks) * Math.PI * 2 + Math.random() * 0.4
        const distance = size * (0.9 + Math.random() * 0.9)
        spark.animate([
          { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
          { transform: `translate(${x + Math.cos(angle) * distance}px, ${y + Math.sin(angle) * distance}px) scale(0.2)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)' }).onfinish = () => spark.remove()
      }

      if(face) {
        face.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.28)' },
          { transform: 'scale(1)' }
        ], { duration: 480, easing: 'cubic-bezier(0.3, 1.8, 0.5, 1)' })
      }
    },

    // The sky lights up from the horizon: warm for gm, cool for gn.
    glow(type) {
      flash.classList.toggle('-moon', type == 'gn')
      flash.animate([
        { opacity: 0 },
        { opacity: type == 'gn' ? 0.6 : 0.85, offset: 0.45 },
        { opacity: 0 }
      ], { duration: 2600, easing: 'ease-in-out' })
    }
  }
}
