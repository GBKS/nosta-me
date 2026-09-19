import { describe, it, expect } from 'vitest'
import externalIdentityHelper from '@/helpers/externalIdentityHelper'

const GITHUB = ['i', 'github:gbks', 'abc123']
const MASTODON = ['i', 'mastodon:bitcoinhackers.org/@gbks', '109775066355589974']
const TWITTER = ['i', 'twitter:gbks', '1619358434134196225']

function profile(tags) {
  return { kind: 0, created_at: 100, tags, content: '{}' }
}

function identities(tags, created_at = 200) {
  return { kind: 10011, created_at, tags, content: '' }
}

describe('externalIdentityHelper.identities', () => {
  it('reads the kind 10011 event', () => {
    const result = externalIdentityHelper.identities(profile([]), [identities([GITHUB, MASTODON])])
    expect(result).toEqual([GITHUB, MASTODON])
  })

  it('falls back to the tags on the profile, where they used to be', () => {
    expect(externalIdentityHelper.identities(profile([GITHUB]), null)).toEqual([GITHUB])
    expect(externalIdentityHelper.identities(profile([GITHUB]), [])).toEqual([GITHUB])
  })

  it('prefers kind 10011 over the profile, and does not mix them', () => {
    const result = externalIdentityHelper.identities(profile([TWITTER]), [identities([GITHUB])])
    expect(result).toEqual([GITHUB])
  })

  it('uses the newest kind 10011 event', () => {
    const older = identities([TWITTER], 200)
    const newer = identities([GITHUB], 300)

    expect(externalIdentityHelper.identities(null, [older, newer])).toEqual([GITHUB])
    expect(externalIdentityHelper.identities(null, [newer, older])).toEqual([GITHUB])
  })

  it('skips a kind 10011 event that is a NIP-51 list of follow sets', () => {
    const followSets = identities([['a', '30000:' + 'a'.repeat(64) + ':friends']], 300)

    expect(externalIdentityHelper.identities(profile([GITHUB]), [followSets])).toEqual([GITHUB])
    expect(externalIdentityHelper.identities(null, [followSets, identities([MASTODON], 200)])).toEqual([MASTODON])
  })

  it('drops tags the profile page could not show, and repeats', () => {
    const result = externalIdentityHelper.identities(null, [identities([
      ['i'],
      ['i', null],
      ['i', 'github'],
      ['i', ':gbks'],
      ['i', 'github:'],
      ['p', 'github:gbks'],
      GITHUB,
      ['i', 'github:gbks', 'another-proof']
    ])])

    expect(result).toEqual([GITHUB])
  })

  it('copes with nothing', () => {
    expect(externalIdentityHelper.identities(null, null)).toEqual([])
    expect(externalIdentityHelper.identities({}, [null, {}])).toEqual([])
  })
})
