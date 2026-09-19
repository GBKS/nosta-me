import { describe, it, expect } from 'vitest'
import highlightHelper from '@/helpers/highlightHelper'

const ALICE = 'a'.repeat(64)
const NOTE = '1'.repeat(64)

function highlight(content, tags = [], created_at = 100) {
  return { id: 'h' + created_at + content.length, kind: 9802, pubkey: ALICE, created_at, content, tags }
}

describe('highlightHelper.parse', () => {
  it('reads the passage and a web source', () => {
    const result = highlightHelper.parse(highlight('Money is a tool.', [['r', 'https://www.example.com/essay?x=1']]))

    expect(result.text).toBe('Money is a tool.')
    expect(result.comment).toBeNull()
    expect(result.source).toEqual({ type: 'web', url: 'https://www.example.com/essay?x=1', name: 'example.com' })
  })

  it('picks the source among the links of a comment', () => {
    const result = highlightHelper.parse(highlight('A passage', [
      ['r', 'https://mentioned.example.com/', 'mention'],
      ['r', 'https://source.example.com/post', 'source'],
      ['comment', 'See also https://mentioned.example.com/']
    ]))

    expect(result.source.name).toBe('source.example.com')
    expect(result.comment).toBe('See also https://mentioned.example.com/')
  })

  it('only links to web pages', () => {
    for(const value of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'nostr:npub1abc', 'not a url', '', null]) {
      expect(highlightHelper.parse(highlight('A passage', [['r', value]])).source, String(value)).toBeNull()
    }
  })

  it('reads an article as the source, with colons in its identifier', () => {
    const result = highlightHelper.parse(highlight('A passage', [['a', '30023:' + ALICE + ':my:article', 'wss://relay.example.com']]))

    expect(result.source).toEqual({ type: 'address', kind: 30023, pubkey: ALICE, identifier: 'my:article', relay: 'wss://relay.example.com' })
  })

  it('reads a note as the source', () => {
    expect(highlightHelper.parse(highlight('A passage', [['e', NOTE]])).source).toEqual({ type: 'event', id: NOTE, relay: null })
  })

  it('has no source when the tags are broken', () => {
    expect(highlightHelper.parse(highlight('A passage', [['a', 'nonsense'], ['a', '30023:short:x'], ['e', 'not-an-id'], ['a'], ['e']])).source).toBeNull()
    expect(highlightHelper.parse({ kind: 9802, content: 'A passage', created_at: 1 }).source).toBeNull()
  })

  it('shortens long passages and tidies whitespace', () => {
    const result = highlightHelper.parse(highlight('First line.\n\n   Second   line. ' + 'x'.repeat(500)))

    expect(result.text.startsWith('First line. Second line. xxx')).toBe(true)
    expect(result.text.length).toBeLessThanOrEqual(320)
    expect(result.text.endsWith('…')).toBe(true)
  })

  it('returns nothing without a passage, or for other events', () => {
    expect(highlightHelper.parse(highlight('   '))).toBeNull()
    expect(highlightHelper.parse({ kind: 1, content: 'A note', tags: [] })).toBeNull()
    expect(highlightHelper.parse({ kind: 9802, content: { text: 'x' } })).toBeNull()
    expect(highlightHelper.parse(null)).toBeNull()
  })
})

describe('highlightHelper.latest', () => {
  it('returns the newest highlights, the same passage only once', () => {
    const events = [
      highlight('Oldest', [], 100),
      highlight('Newest', [], 300),
      highlight('Newest', [], 250), // The same passage found on another relay, or highlighted twice
      highlight('', [], 400),
      highlight('Middle', [], 200)
    ]

    expect(highlightHelper.latest(events, 2).map(item => item.text)).toEqual(['Newest', 'Middle'])
    expect(highlightHelper.latest(events).length).toBe(3)
  })

  it('does not reorder the list it was given, and copes with nothing', () => {
    const events = [highlight('Old', [], 100), highlight('New', [], 200)]
    highlightHelper.latest(events, 1)

    expect(events[0].content).toBe('Old')
    expect(highlightHelper.latest(null, 2)).toEqual([])
  })
})
