import { describe, it, expect } from 'vitest'
import paymentTargetHelper from '@/helpers/paymentTargetHelper'

function targetsEvent(tags, created_at = 100) {
  return { kind: 10133, created_at, tags, content: '' }
}

describe('paymentTargetHelper.targets', () => {
  it('reads the payto tags, in the order the user put them', () => {
    const event = targetsEvent([
      ['payto', 'bitcoin', 'bc1qxq66e0t8d7ugdecwnmv58e90tpry23nc84pg9k'],
      ['payto', 'nano', 'nano_1dctqbmqxfppo9pswbm6kg9d4s4mbraqn8i4m7ob9gnzz91aurmuho48jx3c'],
      ['alt', 'Payment targets']
    ])

    expect(paymentTargetHelper.targets([event])).toEqual([
      { type: 'bitcoin', name: 'Bitcoin', address: 'bc1qxq66e0t8d7ugdecwnmv58e90tpry23nc84pg9k' },
      { type: 'nano', name: 'Nano', address: 'nano_1dctqbmqxfppo9pswbm6kg9d4s4mbraqn8i4m7ob9gnzz91aurmuho48jx3c' }
    ])
  })

  it('uses the newest event', () => {
    const older = targetsEvent([['payto', 'bitcoin', 'bc1qold']], 100)
    const newer = targetsEvent([['payto', 'bitcoin', 'bc1qnew']], 200)

    expect(paymentTargetHelper.targets([older, newer])[0].address).toBe('bc1qnew')
    expect(paymentTargetHelper.targets([newer, older])[0].address).toBe('bc1qnew')
  })

  it('names the spellings people use, and shows unknown types as written', () => {
    const event = targetsEvent([
      ['payto', 'XMR', '45H6MXry6cqS'],
      ['payto', 'Bitcoin (Silent Payments)', 'sp1qqtqljxv7'],
      ['payto', 'liberland dollar', '5abc']
    ])

    expect(paymentTargetHelper.targets([event]).map(target => target.name)).toEqual([
      'Monero',
      'Bitcoin silent payments',
      'Liberland dollar'
    ])
  })

  it('leaves out the lightning address that is on the profile already', () => {
    const event = targetsEvent([
      ['payto', 'lightning', 'Alice@GetAlby.com'],
      ['payto', 'lightning', 'alice@coinos.io']
    ])

    const result = paymentTargetHelper.targets([event], ['alice@getalby.com', null])
    expect(result.map(target => target.address)).toEqual(['alice@coinos.io'])
  })

  it('lists an address once, also under another spelling of its type', () => {
    const event = targetsEvent([
      ['payto', 'monero', '45H6MXry6cqS'],
      ['payto', 'xmr', '45H6MXry6cqS'],
      ['payto', 'monero', '85vdcm2K5n2P']
    ])

    expect(paymentTargetHelper.targets([event]).length).toBe(2)
  })

  it('drops tags that are incomplete or absurdly long, and stops at 20', () => {
    const broken = targetsEvent([
      ['payto'],
      ['payto', 'bitcoin'],
      ['payto', '', 'bc1q'],
      ['payto', 'bitcoin', '   '],
      ['payto', 'bitcoin', { address: 'bc1q' }],
      ['payto', 'x'.repeat(31), 'abc'],
      ['payto', 'bitcoin', 'b'.repeat(501)]
    ])
    expect(paymentTargetHelper.targets([broken])).toEqual([])

    const many = targetsEvent(Array.from({ length: 50 }, (_, i) => ['payto', 'bitcoin', 'bc1q' + i]))
    expect(paymentTargetHelper.targets([many]).length).toBe(20)
  })

  it('copes with nothing and with other events', () => {
    expect(paymentTargetHelper.targets(null)).toEqual([])
    expect(paymentTargetHelper.targets([null, {}, { kind: 0, tags: [['payto', 'bitcoin', 'bc1q']] }])).toEqual([])
  })
})
