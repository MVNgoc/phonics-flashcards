import { describe, it, expect } from 'vitest'
import type { Phoneme, PhonemeType } from './types'
import {
  alignItems,
  buildItems,
  difficulty,
  diffTokens,
  exampleWords,
  formatAnswer,
  gradeDictation,
  labelKey,
  mixedQueue,
  nucleusKeys,
  parseBreakdown,
  type DictationItem,
} from './dictation'
import { builtinSeedData } from './seed'
import { newReviewState } from './sm2'

function make(spec: [note: string, type: PhonemeType, graphemes: [string, string[]][]][]): Phoneme[] {
  return spec.map(([note, type, graphemes], i) => ({
    id: `p${i}`,
    type,
    note,
    graphemes: graphemes.map(([spelling, examples], j) => ({
      id: `p${i}-g${j}`,
      spelling,
      examples,
      review: newReviewState(),
    })),
  }))
}

const seed = builtinSeedData().phonemes

/**
 * Dựng một từ bằng bảng seed và phát âm cho sẵn. Từ được đưa vào danh sách luyện
 * qua một âm không nhãn (không tham gia căn), để không thành ví dụ của trường hợp nào.
 */
function itemFor(word: string, prons: string[], phonemes: Phoneme[] = seed, extra = {}): DictationItem {
  const carrier: Phoneme = {
    id: 'carrier',
    type: 'consonant',
    graphemes: [{ id: 'carrier-g', spelling: 'zzz', examples: [word], review: newReviewState() }],
  }
  const { items } = buildItems([...phonemes, carrier], { [word]: prons }, extra)
  const item = items.find((i) => i.word === word)
  if (!item) throw new Error(`không căn được ${word}`)
  return item
}

const nuclei = nucleusKeys(seed)

describe('labelKey', () => {
  it('bỏ dấu / và khoảng trắng, viết thường', () => {
    expect(labelKey('/d/')).toBe('d')
    expect(labelKey('oo (L)')).toBe('oo(l)')
    expect(labelKey('th (UV)')).toBe('th(uv)')
  })
})

describe('exampleWords', () => {
  it('lấy từ một chữ, bỏ chú thích trước dấu hai chấm, không trùng', () => {
    const phonemes = make([
      ['/r/', 'consonant', [['rh', ['(h câm): rhythm', 'rhino']], ['r', ['Rhino', 'ice cream']]]],
    ])
    expect(exampleWords(phonemes)).toEqual(['rhythm', 'rhino'])
  })
})

describe('buildItems: cắt chữ ↔ âm theo bảng', () => {
  it('daughter → d·augh·t·er = /d/or/./t/ur/, nhấn âm tiết đầu', () => {
    const item = itemFor('daughter', ['d ˈɔː t ə'])
    const a = item.answers[0]
    expect(a.steps!.map((s) => s.spelling)).toEqual(['d', 'augh', 't', 'er'])
    expect(a.tokens).toEqual(['d', 'or', 't', 'ur'])
    expect(a.nuclei).toBe(2)
    expect(a.stress).toBe(0)
    expect(formatAnswer(a)).toBe("'/d/or/./t/ur/")
  })

  it('schwa không nhấn ghi là /u/; ghi theo âm ngắn của chữ cũng được — award: /u/ hoặc /a/, không ra /ai/ hay /ar/', () => {
    const item = itemFor('award', ['ə w ˈɔː d'])
    expect(item.answers.map((a) => a.tokens.join(' '))).toEqual(['u w or d', 'a w or d'])
    expect(item.answers[0].steps![0].spelling).toBe('a')
    expect(item.answers[0].stress).toBe(1)
  })

  it('nguyên âm lướt ɪ ghi /i/ theo âm nghe được, chấp nhận cả ghi theo chữ', () => {
    expect(itemFor('delicious', ['d ɪ l ˈɪ ʃ ə s']).answers.map((a) => a.tokens.join(' '))).toEqual([
      'd i l i sh u s',
      'd e l i sh u s',
    ])
  })

  it('nhãn trong bảng vốn đọc đúng âm lướt thì giữ: honey → /ee/', () => {
    expect(itemFor('honey', ['h ˈɐ n i']).answers[0].tokens).toEqual(['h', 'u', 'n', 'ee'])
  })

  it('schwa viết có r giữ /ur/, /ul/ giữ nguyên', () => {
    expect(itemFor('doctor', ['d ˈɒ k t ə']).answers[0].tokens).toEqual(['d', 'o', 'k', 't', 'ur'])
    expect(itemFor('pencil', ['p ˈɛ n s ə l']).answers[0].tokens).toEqual(['p', 'e', 'n', 's', 'ul'])
    expect(itemFor('student', ['s t j ˈuː d ə n t']).answers.map((a) => a.tokens.join(' '))).toEqual([
      's t yoo d u n t',
      's t yoo d e n t',
    ])
  })

  it('th ghi rõ vô thanh / hữu thanh theo âm thật, oo ghi rõ long / short', () => {
    expect(itemFor('think', ['θ ˈɪ ŋ k']).answers[0].tokens).toEqual(['th(uv)', 'i', 'ng'])
    expect(itemFor('mother', ['m ˈɐ ð ə']).answers[0].tokens).toEqual(['m', 'u', 'th(v)', 'ur'])
    expect(formatAnswer(itemFor('food', ['f ˈuː d']).answers[0])).toBe('/f/oo (L)/d/')
    expect(itemFor('book', ['b ˈʊ k']).answers[0].tokens).toEqual(['b', 'oo(s)', 'k'])
  })

  it('chia âm tiết với th (UV): ath.lete', () => {
    const a = itemFor('athlete', ['ˈæ θ l iː t']).answers[0]
    expect(a.syllables.map((syl) => syl.map((s) => s.token))).toEqual([['a', 'th (UV)'], ['l', 'ee', 't']])
  })

  it('/ul/ chỉ ở cuối âm tiết: delicious bắt đầu bằng /d/i/l/, không phải /d/ul/', () => {
    expect(itemFor('delicious', ['d ɪ l ˈɪ ʃ ə s']).answers[0].tokens.slice(0, 3)).toEqual(['d', 'i', 'l'])
    expect(itemFor('pencil', ['p ˈɛ n s ə l']).answers[0].tokens).toEqual(['p', 'e', 'n', 's', 'ul'])
  })

  it('ture: tu đọc /ch/, re đọc /ur/', () => {
    expect(itemFor('nature', ['n ˈeɪ tʃ ə']).answers[0].tokens).toEqual(['n', 'ai', 'ch', 'ur'])
  })

  it('wa ở /o/: w vẫn là /w/, chỉ a đọc /o/', () => {
    expect(itemFor('water', ['w ˈɔː t ə']).answers[0].tokens).toEqual(['w', 'o', 't', 'ur'])
  })

  it('chữ câm ngoài bảng gộp vào cụm trước và đánh dấu máy đoán', () => {
    const a = itemFor('talk', ['t ˈɔː k']).answers[0]
    expect(a.steps!.map((s) => s.spelling)).toEqual(['t', 'al', 'k'])
    expect(a.tokens).toEqual(['t', 'o', 'k'])
    expect(a.guessed).toBe(true)
  })

  it('r trước nguyên âm: chấp nhận cả nhập vào âm trước lẫn tách /r/', () => {
    const tokens = itemFor('story', ['s t ˈɔː ɹ i']).answers.map((a) => a.tokens.join(' '))
    expect(tokens).toContain('s t or i')
    expect(tokens).toContain('s t or r i')
  })

  it('nhiều phát âm → nhiều đáp án', () => {
    const tokens = itemFor('either', ['ˈaɪ ð ə', 'ˈiː ð ə']).answers.map((a) => a.tokens.join(' '))
    expect(tokens).toEqual(['igh th(v) ur', 'ee th(v) ur'])
  })

  it('bảng ghi từ là ví dụ của trường hợp nào thì tin bảng (because ở au của /or/)', () => {
    const { items } = buildItems(seed, { because: ['b ɪ k ˈɒ z'] })
    expect(items.find((i) => i.word === 'because')!.answers[0].tokens).toEqual(['b', 'i', 'k', 'or', 'z'])
  })

  it('cách cắt khớp với ví dụ trong bảng lên đầu (heart → ea của /a/)', () => {
    const { items } = buildItems(seed, { heart: ['h ˈɑː t'] })
    expect(items.find((i) => i.word === 'heart')!.answers[0].tokens).toEqual(['h', 'a', 't'])
  })

  it('thiếu phát âm hoặc không cắt được → nằm trong unresolved', () => {
    const phonemes = make([
      ['/k/', 'consonant', [['c', ['cat', 'cxz']]]],
      ['/a/', 'vowel', [['a', ['cat']]]],
      ['/t/', 'consonant', [['t', ['cat']]]],
    ])
    const { items, unresolved } = buildItems(phonemes, { cat: ['k ˈæ t'], cxz: ['k ˈæ t'] })
    expect(items.map((i) => i.word)).toEqual(['cat'])
    expect(unresolved).toEqual([{ word: 'cxz', reason: 'no-align' }])
    expect(buildItems(phonemes, {}).unresolved.map((u) => u.reason)).toEqual(['no-pron', 'no-pron'])
  })

  it('đáp án người dùng thêm được chấp nhận, không trùng đáp án máy', () => {
    const item = itemFor('daughter', ['d ˈɔː t ə'], seed, { daughter: ['d o t ur', 'd or t ur'] })
    expect(item.answers.map((a) => [a.tokens.join(' '), a.source])).toEqual([
      ['d or t ur', 'auto'],
      ['d o t ur', 'user'],
    ])
  })
})

describe('từ luyện thêm từ từ điển', () => {
  it('lấy từ cắt gọn được, bỏ từ trùng từ ví dụ, bỏ từ phải đoán chữ câm, không vào unresolved', () => {
    const { items, unresolved } = alignItems(
      seed,
      { cat: ['k ˈæ t'], carrot: ['k ˈæ ɹ ə t'], chalk: ['tʃ ˈɔː k'], xyzzy: ['k ˈæ t'], nopron: [] },
      ['cat', 'carrot', 'chalk', 'xyzzy', 'nopron'],
    )
    const extra = items.filter((i) => !i.fromTable).map((i) => i.word)
    expect(extra).toEqual(['carrot'])
    expect(unresolved.some((u) => u.word === 'xyzzy' || u.word === 'nopron')).toBe(false)
  })
})

describe('difficulty', () => {
  it('từ nhiều âm tiết, nhiều âm ơ, cách viết hiếm khó hơn', () => {
    const cat = difficulty(itemFor('cat', ['k ˈæ t']).answers[0])
    const daughter = difficulty(itemFor('daughter', ['d ˈɔː t ə']).answers[0])
    const comfortable = difficulty(itemFor('comfortable', ['k ˈɐ m f t ə b ə l']).answers[0])
    expect(cat).toBeLessThan(daughter)
    expect(daughter).toBeLessThan(comfortable)
  })
})

describe('mixedQueue', () => {
  const items: DictationItem[] = Array.from({ length: 30 }, (_, k) => ({
    word: `w${k}`,
    answers: [],
    fromTable: true,
    difficulty: k,
  }))

  it('đủ mọi từ, không trùng', () => {
    const q = mixedQueue(items)
    expect(q).toHaveLength(30)
    expect(new Set(q).size).toBe(30)
  })

  it('mỗi nhóm 3 từ liên tiếp có đủ một từ dễ, một vừa, một khó', () => {
    const level = (w: string) => Math.floor(Number(w.slice(1)) / 10)
    const q = mixedQueue(items)
    for (let i = 0; i < 30; i += 3) {
      expect(q.slice(i, i + 3).map(level).sort()).toEqual([0, 1, 2])
    }
  })
})

describe('parseBreakdown', () => {
  it('dạng có dấu /', () => {
    expect(parseBreakdown("/o/.'/d/a/s/./i/t/./i/", nuclei)).toEqual({
      tokens: ['o', 'd', 'a', 's', 'i', 't', 'i'],
      syllables: [['o'], ['d', 'a', 's'], ['i', 't'], ['i']],
      stress: 1,
    })
  })

  it('dạng cách nhau bằng dấu cách, ˈ thay cho \'', () => {
    const p = parseBreakdown('ˈb oo (S) k . s', nuclei)
    expect(p.tokens).toEqual(['b', 'oo(s)', 'k', 's'])
    expect(p.stress).toBe(0)
  })

  it('biến thể trong ngoặc: có hay không dấu cách, hoa thường đều được', () => {
    expect(parseBreakdown("/th (UV)/i/ng/k/ . /th(v)/oo(l)/ . 'B OO ( L ) t", nuclei).tokens).toEqual([
      'th(uv)', 'i', 'ng', 'k', 'th(v)', 'oo(l)', 'b', 'oo(l)', 't',
    ])
    expect(parseBreakdown('short oo long /oo/', nuclei).tokens).toEqual(['oo(s)', 'oo(l)'])
  })

  it('oo (L) / oo (S) là hạt nhân âm tiết', () => {
    expect(parseBreakdown("b oo(s) . 'k oo(l)", nuclei).stress).toBe(1)
  })

  it('dấu nhấn đặt trước phụ âm đầu âm tiết vẫn chỉ đúng hạt nhân của âm tiết đó', () => {
    expect(parseBreakdown("d or . 't ur", nuclei).stress).toBe(1)
  })

  it('không có dấu nhấn → null; dấu chấm thừa không tạo âm tiết rỗng', () => {
    const p = parseBreakdown('. d or .. t ur .', nuclei)
    expect(p.stress).toBeNull()
    expect(p.syllables).toEqual([['d', 'or'], ['t', 'ur']])
  })
})

describe('diffTokens', () => {
  it('đánh dấu phần chung dài nhất', () => {
    expect(diffTokens(['d', 'o', 't', 'ur'], ['d', 'or', 't', 'ur'])).toEqual({
      a: [true, false, true, true],
      b: [true, false, true, true],
      distance: 2,
    })
  })
})

describe('gradeDictation', () => {
  const daughter = itemFor('daughter', ['d ˈɔː t ə'])

  it('đúng hết, không chấm vị trí dấu chấm', () => {
    const g = gradeDictation(daughter, parseBreakdown("'/d/or/t/./ur/", nuclei), ' Daughter ')
    expect([g.sounds, g.stress, g.word]).toEqual([true, true, true])
  })

  it('sai âm, sai nhấn, sai từ được chấm riêng', () => {
    const g = gradeDictation(daughter, parseBreakdown("/d/o/.'/t/ur/", nuclei), 'dauter')
    expect([g.sounds, g.stress, g.word]).toEqual([false, false, false])
    expect(g.inputMarks).toEqual([true, false, true, true])
  })

  it('từ một âm tiết không cần dấu nhấn', () => {
    const cat = itemFor('cat', ['k ˈæ t'])
    expect(gradeDictation(cat, parseBreakdown('k a t', nuclei), 'cat').stress).toBe(true)
  })

  it('khớp đáp án người dùng thêm', () => {
    const item = itemFor('daughter', ['d ˈɔː t ə'], seed, { daughter: ['d o t ur'] })
    const g = gradeDictation(item, parseBreakdown("'d o . t ur", nuclei), 'daughter')
    expect([g.sounds, g.stress, g.answer.source]).toEqual([true, true, 'user'])
  })
})

describe('seed', () => {
  it('đa số từ ví dụ trong seed có đáp án', async () => {
    const prons = (await import('../data/pronunciations.json')).default as Record<string, string[]>
    const { items, unresolved } = buildItems(seed, prons)
    expect(items.length / (items.length + unresolved.length)).toBeGreaterThan(0.9)
  })
})
