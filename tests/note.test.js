import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import * as linkify from 'linkifyjs'
import Note from '@/components/profile/bits/note.vue'

// app.vue does this on startup. Without it linkify doesn't see nostr: links
// at all, and the tests for them would pass without testing anything.
linkify.registerCustomProtocol('nostr', true)

/*

Notes show whatever people posted, so this is where hostile and broken
content ends up. The XSS case is the one fixed in #107: linkify accepts
angle brackets inside URLs, and link labels were set with innerHTML.

 */

async function mountNote(text) {
  return await mountSuspended(Note, { props: { text, info: {} } })
}

describe('note rendering', () => {
  it('does not turn markup inside a URL into elements', async () => {
    const payloads = [
      'https://x.com/<svg/onload=alert(1)>',
      'look https://x.com/a<img/src=x/onerror=alert(1)> here',
      'x.com/<svg/onload=alert(document.domain)>'
    ]

    for(const payload of payloads) {
      const wrapper = await mountNote(payload)
      const copy = wrapper.find('.copy')

      expect(copy.findAll('svg').length, payload).toBe(0)
      expect(copy.findAll('img').length, payload).toBe(0)
      expect(copy.html(), payload).not.toMatch(/<[a-z]+[^>]*\son[a-z]+=/i)

      // It's still there, as text.
      expect(copy.text(), payload).toContain('<')
    }
  })

  it('links URLs, with a shortened label and safe rel and target', async () => {
    const wrapper = await mountNote('read https://www.nytimes.com/2026/09/08/opinion/some-long-article.html today')
    const link = wrapper.find('.copy a')

    expect(link.attributes('href')).toBe('https://www.nytimes.com/2026/09/08/opinion/some-long-article.html')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.text()).toBe('www.nytimes...rticle.html')
    expect(wrapper.text()).toContain('read')
    expect(wrapper.text()).toContain('today')
  })

  it('shows nostr: links that do not decode as plain text instead of throwing', async () => {
    const texts = [
      'hello nostr:npub1notvalidatall and more',
      'see nostr:nprofile1zzzz ok',
      'x nostr:naddr1qqqq y',
      'x nostr:nrelay1qqqq y'
    ]

    // Make sure these really are recognized as links, so the component has to deal with them.
    expect(linkify.tokenize(texts[0]).some(token => token.t == 'url' && token.v.indexOf('nostr:npub') === 0)).toBe(true)

    for(const text of texts) {
      const wrapper = await mountNote(text)
      expect(wrapper.find('.copy').text(), text).toBe(text)
    }
  })

  it('links note and event references to a client', async () => {
    const wrapper = await mountNote('nostr:note1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsmhltgl')
    const link = wrapper.find('.copy a')

    expect(link.text()).toBe('View note')
    expect(link.attributes('href')).toContain('https://primal.net/e/note1')
  })

  it('moves images into a gallery', async () => {
    const wrapper = await mountNote('look at this https://example.com/photo.jpg')

    expect(wrapper.find('.copy').findAll('img').length).toBe(0)
    expect(wrapper.find('.gallery img').attributes('src')).toBe('https://example.com/photo.jpg')
  })

  it('keeps line breaks, but not leading ones', async () => {
    const wrapper = await mountNote('\nfirst line\nsecond line')
    const html = wrapper.find('.copy p').html()

    expect(html).toMatch(/first line<br>second line/)
    expect(html).not.toMatch(/<p[^>]*><br>/)
  })
})
