import { describe, it, expect } from 'vitest'
import type { AppData, PhonemeType } from './types'
import {
  allSpellingKeys,
  filterPhonemes,
  highlightExample,
  lookupSound,
  lookupSpelling,
  normalizeQuery,
  soundCore,
  soundKey,
  spellingKey,
} from './lookup'
import { builtinSeedData } from './seed'
import { newReviewState } from './sm2'

function make(spec: [note: string, type: PhonemeType, graphemes: [string, string[]][]][]): AppData {
  return {
    phonemes: spec.map(([note, type, graphemes], i) => ({
      id: `p${i}`,
      type,
      note,
      graphemes: graphemes.map(([spelling, examples], j) => ({
        id: `p${i}-g${j}`,
        spelling,
        examples,
        review: newReviewState(),
      })),
    })),
  }
}

const data = make([
  ['/i/', 'vowel', [['i', ['ship']], ['y', ['happy']]]],
  ['/ai/', 'vowel', [['a-e', ['face']], ['eigh', ['eight']], ['ae', ['sundae']]]],
  ['/igh/', 'vowel', [['igh', ['light']], ['y', ['sky']]]],
  ['/r/', 'consonant', [['wr (w câm)', ['write']]]],
  ['/s/', 'consonant', [['ce', ['ice']], ['ce (ce đứng cuối - e câm)', ['dance']]]],
  ['/ks/', 'consonant', [['x', ['box']]]],
  ['/ksh/', 'consonant', [['x', ['luxury']], ['xi', ['anxious']]]],
  ['/y/', 'consonant', [['y', ['yes']]]],
  ['Short /oo/', 'vowel', [['oo', ['book']]]],
  ['Long /oo/', 'vowel', [['oo', ['zoo']]]],
  ['/oor/', 'vowel', [['oor', ['poor']]]],
  ['/air/', 'vowel', [['air', ['chair']]]],
])

const notes = (hits: { phoneme: { note?: string } }[]) => hits.map((h) => h.phoneme.note)
const spellings = (hits: { grapheme: { spelling: string } }[]) => hits.map((h) => h.grapheme.spelling)

describe('normalizeQuery / spellingKey', () => {
  it('bỏ khoảng trắng, không phân biệt hoa thường, _ thành -', () => {
    expect(normalizeQuery('  IGH ')).toBe('igh')
    expect(normalizeQuery('a_e')).toBe('a-e')
    expect(normalizeQuery('a - e')).toBe('a-e')
  })

  it('bỏ chú thích trong ngoặc', () => {
    expect(spellingKey('wr (w câm)')).toBe('wr')
    expect(spellingKey('th (UV)')).toBe('th')
    expect(spellingKey('ce (ce đứng cuối - e câm)')).toBe('ce')
    expect(spellingKey('a-e')).toBe('a-e')
  })
})

describe('lookupSpelling', () => {
  it('ra mọi âm có cách viết trùng, cả nguyên âm lẫn phụ âm, đúng thứ tự data', () => {
    const r = lookupSpelling(data, 'y')
    expect(notes(r.exact)).toEqual(['/i/', '/igh/', '/y/'])
  })

  it('không phân biệt hoa thường và khoảng trắng', () => {
    expect(notes(lookupSpelling(data, ' Y ').exact)).toEqual(['/i/', '/igh/', '/y/'])
  })

  it('khớp được cách viết có chú thích', () => {
    expect(notes(lookupSpelling(data, 'wr').exact)).toEqual(['/r/'])
    expect(spellingKey(lookupSpelling(data, 'ce').exact[1].grapheme.spelling)).toBe('ce')
    expect(lookupSpelling(data, 'ce').exact).toHaveLength(2)
  })

  it('cách viết chứa chữ tra nằm ở related, không lẫn vào exact', () => {
    const r = lookupSpelling(data, 'igh')
    expect(notes(r.exact)).toEqual(['/igh/'])
    expect(spellings(r.related)).toEqual(['eigh'])
  })

  it('related xếp cách viết ngắn lên trước', () => {
    const r = lookupSpelling(data, 'x')
    expect(notes(r.exact)).toEqual(['/ks/', '/ksh/'])
    expect(spellings(r.related)).toEqual(['xi'])
  })

  it('a-e và ae là hai cách viết khác nhau', () => {
    expect(spellings(lookupSpelling(data, 'a-e').exact)).toEqual(['a-e'])
    expect(spellings(lookupSpelling(data, 'a_e').exact)).toEqual(['a-e'])
    expect(spellings(lookupSpelling(data, 'ae').exact)).toEqual(['ae'])
  })

  it('chữ tra rỗng hoặc không có thì không ra gì', () => {
    expect(lookupSpelling(data, '   ')).toEqual({ exact: [], related: [] })
    expect(lookupSpelling(data, 'qq')).toEqual({ exact: [], related: [] })
  })

  it('chạy được trên bộ âm soạn sẵn', () => {
    expect(notes(lookupSpelling(builtinSeedData(), 'y').exact)).toEqual(['/i/', '/igh/', '/y/'])
  })
})

describe('allSpellingKeys', () => {
  it('không trùng, đã bỏ chú thích, có sắp xếp', () => {
    const keys = allSpellingKeys(data)
    expect(keys.filter((k) => k === 'ce')).toHaveLength(1)
    expect(keys).toContain('wr')
    expect(keys).toEqual([...keys].sort())
  })
})

describe('highlightExample', () => {
  const show = (word: string, spelling: string) =>
    highlightExample(word, spelling)
      .map((s) => (s.hit ? `[${s.text}]` : s.text))
      .join('')

  it('tô chỗ xuất hiện đầu tiên', () => {
    expect(show('happy', 'y')).toBe('happ[y]')
    expect(show('light', 'igh')).toBe('l[igh]t')
    expect(show('colour', 'o')).toBe('c[o]lour')
  })

  it('giữ nguyên hoa thường của ví dụ', () => {
    expect(show('Pour', 'our')).toBe('P[our]')
    expect(show('Europe', 'eu')).toBe('[Eu]rope')
  })

  it('cách viết có chú thích vẫn tô được', () => {
    expect(show('write', 'wr (w câm)')).toBe('[wr]ite')
  })

  it('tách đôi: tô cặp cuối cùng', () => {
    expect(show('face', 'a-e')).toBe('f[a]c[e]')
    expect(show('delete', 'e-e')).toBe('del[e]t[e]')
    expect(show('youtube', 'u-e')).toBe('yout[u]b[e]')
  })

  it('không tìm thấy thì không tô', () => {
    expect(show('tee', 'ea')).toBe('tee')
    expect(show('love', 'a-e')).toBe('love')
  })
})

describe('soundKey / soundCore', () => {
  it('bỏ dấu "/", khoảng trắng, hoa thường', () => {
    expect(soundKey('/ai/')).toBe('ai')
    expect(soundKey('Short /oo/')).toBe('shortoo')
    expect(soundKey(' short oo ')).toBe('shortoo')
  })

  it('core là phần giữa hai dấu "/"', () => {
    expect(soundCore('Short /oo/')).toBe('oo')
    expect(soundCore('/ai/')).toBe('ai')
    expect(soundCore('ai')).toBe('ai')
  })
})

describe('lookupSound', () => {
  const notes2 = (ps: { note?: string }[]) => ps.map((p) => p.note)

  it('gõ có hay không có dấu "/" đều ra', () => {
    expect(notes2(lookupSound(data, 'ai').exact)).toEqual(['/ai/'])
    expect(notes2(lookupSound(data, '/AI/').exact)).toEqual(['/ai/'])
  })

  it('âm có tên chứa chữ tra nằm ở related', () => {
    expect(notes2(lookupSound(data, 'ai').related)).toEqual(['/air/'])
  })

  it('"oo" ra cả Short lẫn Long, "short oo" chỉ ra Short', () => {
    expect(notes2(lookupSound(data, 'oo').exact)).toEqual(['Short /oo/', 'Long /oo/'])
    expect(notes2(lookupSound(data, 'oo').related)).toEqual(['/oor/'])
    expect(notes2(lookupSound(data, 'short oo').exact)).toEqual(['Short /oo/'])
  })

  it('chữ tra rỗng hoặc không có thì không ra gì', () => {
    expect(lookupSound(data, ' / ')).toEqual({ exact: [], related: [] })
    expect(lookupSound(data, 'qq')).toEqual({ exact: [], related: [] })
  })
})

describe('filterPhonemes', () => {
  const found = (q: string) => filterPhonemes(data.phonemes, q).map((p) => p.note)

  it('chữ tìm rỗng thì giữ nguyên danh sách', () => {
    expect(filterPhonemes(data.phonemes, '')).toBe(data.phonemes)
    expect(filterPhonemes(data.phonemes, ' / ')).toBe(data.phonemes)
  })

  it('khớp tên âm không cần dấu "/", trùng tên đứng trước tên chứa chữ tìm', () => {
    expect(found('ks')).toEqual(['/ks/', '/ksh/'])
    expect(found('/KS')).toEqual(['/ks/', '/ksh/'])
  })

  it('gõ đủ hai dấu "/" thì chỉ lấy âm trùng tên', () => {
    expect(found('/KS/')).toEqual(['/ks/'])
    expect(found('/s/')).toEqual(['/s/'])
    expect(found('/oo/')).toEqual(['Short /oo/', 'Long /oo/'])
  })

  it('gõ có dấu "/" thì không khớp chữ "Short", "Long" trong tên âm', () => {
    // Không có "/" thì "s" vẫn khớp "Short /oo/" như một phần tên.
    expect(found('/s')).toEqual(['/s/', '/ks/', '/ksh/'])
    expect(found('/t')).toEqual([])
    expect(found('/o')).toEqual(['Short /oo/', 'Long /oo/', '/oor/'])
  })

  it('gõ có dấu "/" thì chỉ tìm theo tên âm, bỏ qua cách viết', () => {
    // Không có "/": /ai/ khớp nhờ cách viết "eigh".
    expect(found('igh')).toEqual(['/igh/', '/ai/'])
    expect(found('/igh/')).toEqual(['/igh/'])
    expect(found('/igh')).toEqual(['/igh/'])
    expect(found('/eigh/')).toEqual([])
  })

  it('khớp cả cách viết, xếp sau âm khớp tên', () => {
    // /i/ trùng tên; /ai/, /igh/, /air/ có "i" trong tên; /ksh/ chỉ khớp ở cách viết "xi".
    expect(found('i')).toEqual(['/i/', '/ai/', '/igh/', '/air/', '/ksh/'])
    expect(found('ai')).toEqual(['/ai/', '/air/'])
    expect(found('eigh')).toEqual(['/ai/'])
  })

  it('cách viết bỏ chú thích trong ngoặc khi so khớp', () => {
    expect(found('wr')).toEqual(['/r/'])
    expect(found('câm')).toEqual([])
  })

  it('không khớp gì thì rỗng', () => {
    expect(found('qq')).toEqual([])
  })
})
