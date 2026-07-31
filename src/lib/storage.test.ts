import { describe, it, expect } from 'vitest'
import { migrate, parseImported } from './storage'
import { newReviewState } from './sm2'
import type { StoredState } from './types'

const v1: StoredState = {
  version: 1,
  data: {
    phonemes: [
      {
        // v1 payloads carried an `ipa` field that no longer exists in the model.
        ipa: '/æ/',
        id: 'p1',
        type: 'vowel',
        note: 'a ngắn',
        graphemes: [
          { id: 'g1', spelling: 'a', examples: ['cat'], review: newReviewState() },
        ],
      } as never,
    ],
  },
}

describe('migrate', () => {
  it('drops ipa from v1 payloads but keeps everything else', () => {
    const data = migrate(v1)
    expect(data.phonemes[0]).not.toHaveProperty('ipa')
    expect(data.phonemes[0].note).toBe('a ngắn')
    expect(data.phonemes[0].graphemes[0].examples).toEqual(['cat'])
  })

  it('leaves v2 payloads untouched', () => {
    const v2: StoredState = { version: 2, data: { phonemes: [] } }
    expect(migrate(v2)).toBe(v2.data)
  })
})

describe('parseImported', () => {
  it('accepts a {version,data} backup', () => {
    expect(parseImported(JSON.stringify(v1)).phonemes).toHaveLength(1)
  })

  it('accepts a bare AppData object', () => {
    expect(parseImported('{"phonemes":[]}').phonemes).toEqual([])
  })

  it('rejects anything without a phonemes array', () => {
    expect(() => parseImported('{"foo":1}')).toThrow()
  })
})
