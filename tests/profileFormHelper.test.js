import { describe, it, expect } from 'vitest'
import profileFormHelper from '@/helpers/profileFormHelper'

const EMPTY_FORM = { name: '', about: '', website: '', picture: '', banner: '', bitcoin: '', handle: '' }

describe('profileFormHelper.merge', () => {
  it('fills an empty form from the first profile that arrives', () => {
    const content = { name: 'alice', about: 'Hi', lud16: 'alice@getalby.com', nip05: 'alice@nosta.me', display_name: 'Alice' }

    expect(profileFormHelper.merge(EMPTY_FORM, null, content)).toEqual({
      name: 'alice', about: 'Hi', website: '', picture: '', banner: '', bitcoin: 'alice@getalby.com', handle: 'alice@nosta.me'
    })
  })

  it('keeps what the user typed when a newer version arrives', () => {
    const shown = { name: 'alice', about: 'Hi' }
    const form = { ...EMPTY_FORM, name: 'alice', about: 'Hi, I am typing a new bi' }
    const newer = { name: 'alice', about: 'Hello from another app', website: 'https://alice.example.com' }

    const result = profileFormHelper.merge(form, shown, newer)

    expect(result.about).toBe('Hi, I am typing a new bi')
    // Fields that were not touched get the newer values
    expect(result.website).toBe('https://alice.example.com')
    expect(result.name).toBe('alice')
  })

  it('keeps a field the user has emptied', () => {
    const result = profileFormHelper.merge({ ...EMPTY_FORM, name: 'alice' }, { name: 'alice', website: 'https://old.example.com' }, { name: 'alice', website: 'https://new.example.com' })

    expect(result.website).toBe('')
  })

  it('empties an untouched field that is gone in the newer version', () => {
    const result = profileFormHelper.merge({ ...EMPTY_FORM, banner: 'https://example.com/b.jpg' }, { banner: 'https://example.com/b.jpg' }, {})

    expect(result.banner).toBe('')
  })

  it('treats values that are not text as empty', () => {
    const result = profileFormHelper.merge(EMPTY_FORM, null, { name: { first: 'Alice' }, about: 42, website: null })

    expect(result).toEqual(EMPTY_FORM)
  })
})

describe('profileFormHelper.content', () => {
  it('parses the content, and survives what is not a profile', () => {
    expect(profileFormHelper.content({ content: '{"name":"alice"}' })).toEqual({ name: 'alice' })
    expect(profileFormHelper.content({ content: { name: 'alice' } })).toEqual({ name: 'alice' })
    expect(profileFormHelper.content({ content: 'not json' })).toEqual({})
    expect(profileFormHelper.content({ content: '[1,2]' })).toEqual({})
    expect(profileFormHelper.content({ content: 'null' })).toEqual({})
    expect(profileFormHelper.content(null)).toEqual({})
  })
})

describe('profileFormHelper.newest', () => {
  it('finds the newest version, and keeps the first of two equal ones', () => {
    const a = { id: 'a', created_at: 100 }
    const b = { id: 'b', created_at: 300 }
    const c = { id: 'c', created_at: 300 }

    expect(profileFormHelper.newest([a, b, c])).toBe(b)
    expect(profileFormHelper.newest([])).toBeNull()
    expect(profileFormHelper.newest(null)).toBeNull()
  })
})
