/*

Some random utility functions.

 */

export default {

  formatRelativeDate: function(dateString, includeAgo) {
    const d = new Date(parseInt(dateString)*1000)
    const now = new Date()

    const delta = now - d

    const units = {
      minute: 1000*60,
      hour: 1000*60*60,
      day: 1000*60*60*24
    }

    if(delta < units.minute) {
      return Math.round(delta/1000) + 's' + (includeAgo ? ' ago' : null)
    } else if(delta < units.hour) {
      return Math.round(delta/1000/60) + 'm' + (includeAgo ? ' ago' : null)
    } else if(delta < units.day) {
      return Math.round(delta/1000/60/60) + 'h' + (includeAgo ? ' ago' : null)
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
  },

  trim(text, maxLength, position) {
    let result = text

    if(result && result.length > maxLength) {
      if(position == 'end') {
        result = result.substr(0, maxLength-2) + '...'
      } else {
        const cutOff = Math.ceil(maxLength/2-2)
        result = result.substr(0, cutOff) + '...' + result.substr(result.length - cutOff)
      }
    }
    
    return result
  },

  dig(object, path, fallback) {
    let result = null

    if(object) {
      result = object

      const bits = path.split('.')
      let i=0, key
      for(; i<bits.length; i++) {
        key = bits[i]

        if(result[key]) {
          result = result[key]
        } else {
          result = null
          break
        }
      }
    }

    if(result == null && fallback) {
      result = fallback
    }

    return result
  }
}