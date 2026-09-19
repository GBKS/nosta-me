/*

Helps the edit page fill its form from the profile versions that relays send.

Relays answer at different times, and may hold different versions of a profile.
The form shows the newest one. A newer version can arrive when the user has
already started typing, and what they typed must not be replaced then.

 */

// Form field to the field of the profile (kind 0 content)
export const PROFILE_FORM_FIELDS = {
  name: 'name',
  about: 'about',
  website: 'website',
  picture: 'picture',
  banner: 'banner',
  bitcoin: 'lud16',
  handle: 'nip05'
}

function text(value) {
  return typeof value == 'string' ? value : ''
}

export default {
  // The content of a profile event as an object. Relays pass on anything.
  content(event) {
    let content = event ? event.content : null

    if(typeof content == 'string') {
      try {
        content = JSON.parse(content)
      } catch(error) {
        content = null
      }
    }

    return content && typeof content == 'object' && !Array.isArray(content) ? content : {}
  },

  newest(events) {
    return (events || []).reduce((newest, event) => {
      return !newest || event.created_at > newest.created_at ? event : newest
    }, null)
  },

  // form: the values in the form now, by form field
  // shownContent: the profile content the form was last filled from, if any
  // newContent: the profile content to show now
  //
  // Returns the values the form should have. A field the user has changed keeps
  // what they typed, the others take the new value.
  merge(form, shownContent, newContent) {
    const result = {}

    for(const field in PROFILE_FORM_FIELDS) {
      const key = PROFILE_FORM_FIELDS[field]
      const shown = text((shownContent || {})[key])
      const edited = text(form[field]) != shown

      result[field] = edited ? text(form[field]) : text((newContent || {})[key])
    }

    return result
  }
}
