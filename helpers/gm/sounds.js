/*

Small sounds for the gm sky, made with the Web Audio API rather than audio
files. Browsers only allow sound after the user clicked something, so the
audio context is created on first use. Muting is remembered.

 */

const STORAGE_KEY = 'gmMuted'
const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]

let context = null

function audio() {
  if(isMuted()) return null

  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)()
    if(context.state == 'suspended') context.resume()
    return context
  } catch(error) {
    return null
  }
}

function tone(frequency, delay, duration, type = 'sine', volume = 0.12) {
  const a = audio()
  if(!a) return

  const oscillator = a.createOscillator()
  const gain = a.createGain()
  const start = a.currentTime + delay
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(a.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.05)
}

export function isMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) == '1'
  } catch(error) {
    return false
  }
}

export function setMuted(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch(error) {
    // Private mode; it just won't be remembered
  }
}

// A chime that gets higher the more people piled in. Moons are an octave lower.
export function chime(level, volume = 0.1, moon = false) {
  const i = Math.max(0, Math.min(SCALE.length - 2, Math.round(level)))
  const factor = moon ? 0.5 : 1
  tone(SCALE[i] * factor, 0, moon ? 1.4 : 0.9, 'sine', volume)
  tone(SCALE[i + 1] * 2 * factor, 0.07, 0.6, 'sine', volume * 0.35)
}

export function sunrise() {
  [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((frequency, i) => tone(frequency, i * 0.16, 2.4, 'triangle', 0.08))
}

export function moonrise() {
  [783.99, 659.25, 523.25, 392, 329.63, 261.63].forEach((frequency, i) => tone(frequency, i * 0.2, 2.6, 'sine', 0.07))
}
