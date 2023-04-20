export default function eventTracker () { 
  return {
    events: [],
    callback: null,

    init(callback) {
      this.callback = callback
    },

    add(name) {
      const index = this.events.indexOf(name)
      if(index === -1) {
        window.emitter.on(name, this.callback)

        this.events.push(name)
      }
    },

    remove(name) {
      const index = this.events.indexOf(name)
      if(index !== -1) {
        window.emitter.off(name, this.callback)

        this.events.splice(index, 1)
      }
    },

    clear() {
      for(let i=0; i<this.events.length; i++) {
        window.emitter.off(this.events[i], this.callback)
      }

      this.events = []
    },

    kill() {
      this.clear()
      this.callback = null
    }
  }
}