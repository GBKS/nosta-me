
/*

Some random utility functions.

 */

export default {

  formatRelativeDate: function(dateString) {
    const d = new Date(parseInt(dateString)*1000)
    const now = new Date()

    const delta = now - d

    const units= {
      minute: 1000*60,
      hour: 1000*60*60,
      day: 1000*60*60*24
    }

    if(delta < units.minute) {
      return Math.round(delta/1000*60*60) + 's'
    } else if(delta < units.hour) {
      return Math.round(delta/1000*60*60) + 'm'
    } else if(delta < units.day) {
      return Math.round(delta/1000*60*60) + 'd'
    } else {
      // Check if it's the same year
      if(d.getFullYear() == now.getFullYear()) {
        const options = { 
          month: 'short', 
          day: 'numeric'
        }
        return d.toLocaleDateString(undefined, options)
      } else {
        const options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        }
        return d.toLocaleDateString(undefined, options)
      }
    }
  }
}