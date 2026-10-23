import { describe, it, expect } from 'vitest'
import type { Phoneme } from './types'
import { buildItems, type DictationItem } from './dictation'
import { SPELLING_TIPS, tipStats, tipsFor } from './spellingTips'
import { builtinSeedData } from './seed'
import { newReviewState } from './sm2'

const seed = builtinSeedData().phonemes

/** Dựng các từ bằng bảng seed + phát âm cho sẵn (đưa từ vào qua một âm không nhãn). */
function items(prons: Record<string, string[]>): DictationItem[] {
  const carrier: Phoneme = {
    id: 'carrier',
    type: 'consonant',
    graphemes: [{ id: 'carrier-g', spelling: 'zzz', examples: Object.keys(prons), review: newReviewState() }],
  }
  return buildItems([...seed, carrier], prons).items
}

const ids = (item: DictationItem) => tipsFor(item).map((h) => `${h.tip.id}:${h.spelling}`)

describe('SPELLING_TIPS', () => {
  it('id không trùng', () => {
    expect(new Set(SPELLING_TIPS.map((t) => t.id)).size).toBe(SPELLING_TIPS.length)
  })
})

describe('tipsFor', () => {
  const words = items({
    famous: ['f ˈeɪ m ə s'],
    campus: ['k ˈæ m p ə s'],
    nation: ['n ˈeɪ ʃ ə n'],
    picture: ['p ˈɪ k tʃ ə'],
    back: ['b ˈæ k'],
    talk: ['t ˈɔː k'],
    catch: ['k ˈæ tʃ'],
    happy: ['h ˈæ p i'],
    bus: ['b ˈɐ s'],
  })
  const get = (w: string) => words.find((i) => i.word === w)!

  it('/u/s/ cuối: famous viết -ous, campus viết -us', () => {
    expect(ids(get('famous'))).toContain('ous:ous')
    expect(ids(get('campus'))).toContain('ous:us')
  })

  it('/u/s/ của từ một âm tiết (bus) không tính', () => {
    expect(ids(get('bus')).some((id) => id.startsWith('ous'))).toBe(false)
  })

  it('đuôi -tion, -ture, -y', () => {
    expect(ids(get('nation'))).toContain('tion:tion')
    expect(ids(get('picture'))).toContain('ture:ture')
    expect(ids(get('happy'))).toContain('y-ee:y')
  })

  it('ck / tch chỉ sau một chữ nguyên âm đọc ngắn: back, catch có; talk không', () => {
    expect(ids(get('back'))).toContain('ck:ck')
    expect(ids(get('catch'))).toContain('tch:tch')
    expect(ids(get('talk')).some((id) => id.startsWith('ck'))).toBe(false)
  })
})

describe('tipStats', () => {
  it('đếm cách viết đuôi trong bộ luyện, nhiều nhất trước', () => {
    const stats = tipStats(
      items({ famous: ['f ˈeɪ m ə s'], nervous: ['n ˈɜː v ə s'], campus: ['k ˈæ m p ə s'] }),
    ).get('ous')!
    expect(stats.words.sort()).toEqual(['campus', 'famous', 'nervous'])
    expect(stats.spellings).toEqual([
      ['ous', 2],
      ['us', 1],
    ])
  })
})
