import { describe, it, expect } from 'vitest'
import { greetingHtml } from '@/helpers/gm/text.js'

function note(content, tags = []) {
  return { content, tags }
}

describe('greetingHtml', () => {
  it('escapes everything from the note', () => {
    const html = greetingHtml(note('gm <img src=x onerror=alert(1)> & "hi"'))
    expect(html).toBe('gm &lt;img src=x onerror=alert(1)&gt; &amp; &quot;hi&quot;')
  })

  it('replaces links and nostr references', () => {
    expect(greetingHtml(note('gm https://example.com/a.jpg'))).toBe('gm 🔗')
    expect(greetingHtml(note('gm nostr:npub1abc123'))).toBe('gm …')
  })

  it('shows custom emoji only from https addresses', () => {
    const html = greetingHtml(note('gm :sun:', [['emoji', 'sun', 'https://example.com/sun.png']]))
    expect(html).toBe('gm <img class="emoji" alt=":sun:" src="https://example.com/sun.png" referrerpolicy="no-referrer">')

    expect(greetingHtml(note('gm :sun:', [['emoji', 'sun', 'javascript:alert(1)']]))).toBe('gm :sun:')
    expect(greetingHtml(note('gm :sun:', [['emoji', 'sun', 'https://example.com/"onerror="alert(1)']]))).toBe('gm :sun:')
    expect(greetingHtml(note('gm :a"b:', [['emoji', 'a"b', 'https://example.com/x.png']]))).toBe('gm :a&quot;b:')
  })

  it('shortens very long notes', () => {
    const html = greetingHtml(note('gm ' + 'a'.repeat(1000)))
    expect(html.length).toBe(601)
    expect(html.endsWith('…')).toBe(true)
  })
})
