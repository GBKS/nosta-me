import { describe, it, expect } from 'vitest'
import profileTipHelper from '@/helpers/profileTipHelper'
import linkHelper from '@/helpers/linkHelper'

// Domains the site used to link to that are gone. pinstr.app and blogstack.io
// were taken over by gambling sites, so a dead link is not just a dead link.
const GONE = ['nostrapp.link', 'badges.page', 'pinstr.app', 'habla.news', 'blogstack.io']

describe('profileTipHelper.getTips', () => {
  // An empty profile gets every tip
  const tips = profileTipHelper.getTips({})

  it('gives every tip a title, a description and a link to an app', () => {
    expect(tips.length).toBeGreaterThan(10)

    for(const tip of tips) {
      expect(tip.title, tip.title).toBeTruthy()
      expect(tip.description, tip.title).toBeTruthy()
      expect(tip.url, tip.title).toMatch(/^https:\/\/[a-z0-9.-]+\/$/)
    }
  })

  it('does not link to apps that are gone', () => {
    for(const tip of tips) {
      expect(GONE, tip.title).not.toContain(new URL(tip.url).hostname)
    }
  })

  it('has no tips for a profile that has done it all', () => {
    const some = [{}]
    const result = profileTipHelper.getTips({
      follows: { tags: [['p', 'a'.repeat(64)]] },
      userStatuses: some, shortNotes: some, longNotes: some, badges: some, lists: some, live: some,
      classifieds: some, products: some, handlers: some, events: some, calendars: some, files: some, reports: some
    })

    expect(result).toBeNull()
  })
})

describe('linkHelper', () => {
  it('does not fall back to apps that are gone', () => {
    const templates = Object.values(linkHelper)
      .filter(value => value && typeof value == 'object')
      .flatMap(group => Object.values(group))
      .filter(value => typeof value == 'string' && value.startsWith('http'))

    expect(templates.length).toBeGreaterThan(5)

    for(const template of templates) {
      expect(GONE, template).not.toContain(new URL(template.split('<')[0].split('{')[0]).hostname)
    }
  })
})
