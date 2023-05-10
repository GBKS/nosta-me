
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
  },

  findTag: function(event, name, fallback) {
    let result = fallback ? fallback : null

    if(event.tags) {
      let i=0, tags=event.tags
      for(; i<tags.length; i++) {
        if(tags[i][0] == name) {
          result = tags[i].slice(1)
          break
        }
      }
    }

    return result
  },

  findTags: function(event, include) {
    const includeArray = Array.isArray(include) ? include : [include]
    let result

    if(event.tags) {
      let i=0, tags=event.tags
      for(; i<tags.length; i++) {
        if(includeArray.indexOf(tags[i][0]) !== -1) {
          if(!result) result = []
          result.push(tags[i].slice(1))
        }
      }
    }

    return result
  },

  findTagsExcluding: function(event, exclude) {
    const excludeArray = Array.isArray(exclude) ? exclude : [exclude]
    let result

    if(event.tags) {
      let i=0, tags=event.tags
      for(; i<tags.length; i++) {
        if(excludeArray.indexOf(tags[i][0]) === -1) {
          if(!result) result = []
          result.push(tags[i].slice(1))
        }
      }
    }

    return result
  }
}