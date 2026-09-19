import { hexToBytes } from 'nostr-tools/utils'

/*

Some random utility functions.

 */

export default {

  // We store private keys as hex strings, nostr-tools wants bytes for signing.
  // Older nsec and recovery phrase logins were saved to local storage as
  // comma-separated bytes, so that format is handled as well.
  privateKeyToBytes(privateKey) {
    if(typeof privateKey === 'string') {
      if(privateKey.indexOf(',') !== -1) {
        return Uint8Array.from(privateKey.split(','), Number)
      }

      return hexToBytes(privateKey)
    }

    return privateKey
  },

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
      return Math.round(delta/1000) + 's' + (includeAgo ? ' ago' : '')
    } else if(delta < units.hour) {
      return Math.round(delta/1000/60) + 'm' + (includeAgo ? ' ago' : '')
    } else if(delta < units.day) {
      return Math.round(delta/1000/60/60) + 'h' + (includeAgo ? ' ago' : '')
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

  // Prices come from user-created events. Intl only takes ISO currency
  // codes and throws for anything else, like "sats", or no currency at all.
  formatPrice(amount, currency) {
    const number = Number(amount)
    const unit = currency ? ('' + currency).toLowerCase() : null

    // Intl accepts BTC and SAT as codes, but rounds to two decimals.
    if(!isNaN(number) && ['btc', 'sat', 'sats'].indexOf(unit) !== -1) {
      const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(number)
      return formatted + ' ' + (unit == 'btc' ? 'BTC' : 'sats')
    }

    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
    } catch(error) {
      const formatted = isNaN(number) ? amount : new Intl.NumberFormat().format(number)
      return currency ? formatted + ' ' + currency : '' + formatted
    }
  },

  // NIP-24 deprecates two profile fields, "to be ignored or removed when found
  // in the wild". Their values move to the fields that replaced them, unless
  // those are filled in already.
  migrateDeprecatedProfileFields(content) {
    const replacements = { displayName: 'display_name', username: 'name' }

    for(const oldField in replacements) {
      if(!(oldField in content)) continue

      const newField = replacements[oldField]
      if(!content[newField] && typeof content[oldField] == 'string' && content[oldField].length > 0) {
        content[newField] = content[oldField]
      }

      delete content[oldField]
    }

    return content
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

  dig(object, path, fallback, requireLength) {
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

    if(result !== null && requireLength && result.length == 0) {
      result = null
    }

    if(result == null && fallback) {
      result = fallback
    }

    return result
  },

  digDeep(object, paths, fallback, requireLength) {
    let result = fallback || null

    if(object) {
      for(let i=0; i<paths.length; i++) {
        result = this.dig(object, paths[i], null, requireLength)

        if(result !== null) {
          break
        }
      }
    }

    return result
  },

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array
  }
}