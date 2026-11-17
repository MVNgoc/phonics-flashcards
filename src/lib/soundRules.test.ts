import { describe, expect, it } from 'vitest'
import {
  buildRuleBank,
  markSegments,
  pickQuestion,
  recordQuiz,
  RULE_CARDS,
  SOUND_RULES,
  weaknessOf,
  type RuleQuestion,
} from './soundRules'

const PRONS: Record<string, string[]> = {
  go: ['g ˈəʊ'],
  two: ['t ˈuː'],
  paper: ['p ˈeɪ p ə'],
  cat: ['k ˈæ t'],
  find: ['f ˈaɪ n d'],
  rain: ['ɹ ˈeɪ n'],
  may: ['m ˈeɪ'],
  key: ['k ˈiː'],
  head: ['h ˈɛ d'],
  bear: ['b ˈɛə'],
  bell: ['b ˈɛ l'],
  midday: ['m ˌɪ d d ˈeɪ'],
  access: ['ˈæ k s ɛ s'],
  watch: ['w ˈɒ tʃ'],
  think: ['θ ˈɪ ŋ k'],
  sing: ['s ˈɪ ŋ'],
  finger: ['f ˈɪ ŋ g ə'],
  hungry: ['h ˈɐ ŋ g ɹ i'],
  singer: ['s ˈɪ ŋ ə'],
  kings: ['k ˈɪ ŋ z'],
  music: ['m j ˈuː z ɪ k'],
  lunch: ['l ˈɐ n tʃ'],
  income: ['ˈɪ n k ɐ m'],
  knife: ['n ˈaɪ f'],
  write: ['ɹ ˈaɪ t'],
  gnome: ['n ˈəʊ m'],
  city: ['s ˈɪ t i'],
  cold: ['k ˈəʊ l d'],
  fancy: ['f ˈæ n s i'],
  gem: ['dʒ ˈɛ m'],
  gas: ['g ˈæ s'],
  get: ['g ˈɛ t'],
  night: ['n ˈaɪ t'],
  eight: ['ˈeɪ t'],
  happy: ['h ˈæ p i'],
  standby: ['s t ˈæ n d b ˌaɪ'],
  promise: ['p ɹ ˈɒ m ɪ s'],
  recipe: ['ɹ ˈɛ s ɪ p i'],
  fire: ['f ˈaɪ ə'],
}

const bank = buildRuleBank(Object.keys(PRONS), PRONS)

function q(ruleId: number, word: string): RuleQuestion[] {
  return bank.questions.filter((x) => x.ruleId === ruleId && x.word === word)
}
function ex(ruleId: number, word: string) {
  return bank.exceptions.find((x) => x.ruleId === ruleId && x.word === word)
}
const marked = (x: { word: string; start: number; end: number }) => x.word.slice(x.start, x.end)

describe('dữ liệu quy tắc', () => {
  it('có đủ 14 quy tắc, id thẻ không trùng', () => {
    expect(SOUND_RULES.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    const ids = RULE_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('buildRuleBank', () => {
  it('#1 nguyên âm đứng cuối: go, pa·per dài; two là ngoại lệ', () => {
    expect(q(1, 'go')[0]).toMatchObject({ answer: 'long', start: 1 })
    expect(marked(q(1, 'paper')[0])).toBe('a')
    expect(ex(1, 'two')).toBeTruthy()
  })

  it('#2 nguyên âm không đứng cuối: cat ngắn; find là ngoại lệ', () => {
    expect(q(2, 'cat')[0].answer).toBe('short')
    expect(ex(2, 'find')?.actual).toContain('aɪ')
  })

  it('#3 hai nguyên âm: rain hỏi cả a (dài) lẫn i (câm); head ngoại lệ; bear không xét', () => {
    expect(q(3, 'rain').map((x) => [marked(x), x.answer])).toEqual([
      ['a', 'long'],
      ['i', 'silent'],
    ])
    expect(q(3, 'rain')[0].cluster).toEqual([1, 3])
    expect(ex(3, 'head')).toBeTruthy()
    expect(q(3, 'may')).toEqual([])
    expect(q(3, 'key')).toEqual([])
    expect(q(3, 'bear')).toEqual([])
    expect(ex(3, 'bear')).toBeUndefined()
  })

  it('#4 phụ âm đôi: bell bỏ l sau; midday đọc cả hai; access không kết luận được', () => {
    expect(q(4, 'bell')[0]).toMatchObject({ start: 3, answer: 'silent' })
    expect(ex(4, 'midday')).toBeTruthy()
    expect(ex(4, 'access')).toBeUndefined()
  })

  it('#5 tch: t câm', () => {
    expect(q(5, 'watch')[0]).toMatchObject({ start: 2, answer: 'silent' })
  })

  it('#6 n trước /g/ /k/ → /ng/; /ng/./g/ chỉ khi ng giữa từ gốc và g trước a, o, u, phụ âm', () => {
    expect(q(6, 'think')[0].answer).toBe('ng')
    expect(q(6, 'sing')[0].answer).toBe('ng')
    expect(q(6, 'hungry')[0].answer).toBe('ngg')
    expect(q(6, 'singer')[0].answer).toBe('ng')
    expect(ex(6, 'finger')).toMatchObject({ expected: 'ng', actual: 'đọc /ng/./g/' })
    expect(q(6, 'kings')[0].answer).toBe('ng')
    expect(q(6, 'lunch')).toEqual([])
    expect(ex(6, 'lunch')).toBeUndefined()
    expect(ex(6, 'income')).toBeTruthy()
  })

  it('#7 #8 #9 chữ câm đầu từ', () => {
    expect(q(7, 'knife')[0]).toMatchObject({ start: 0, answer: 'silent', cluster: [0, 2] })
    expect(q(8, 'write')[0]).toMatchObject({ start: 0, answer: 'silent' })
    expect(q(9, 'gnome')[0]).toMatchObject({ start: 0, answer: 'silent' })
  })

  it('#10 c: city /s/, cold /k/, c cuối từ (music) /k/; fancy không phải ngoại lệ của #10', () => {
    expect(q(10, 'city')[0].answer).toBe('s')
    expect(q(10, 'cold')[0].answer).toBe('k')
    expect(q(10, 'music')[0]).toMatchObject({ start: 4, answer: 'k' })
    expect(ex(10, 'fancy')).toBeUndefined()
  })

  it('#11 g: gem /j/, gas /g/, get là ngoại lệ', () => {
    expect(q(11, 'gem')[0].answer).toBe('j')
    expect(q(11, 'gas')[0].answer).toBe('g')
    expect(ex(11, 'get')).toBeTruthy()
  })

  it('#12 igh: night hỏi i dài + gh câm; eight không xét', () => {
    expect(q(12, 'night').map((x) => [marked(x), x.answer])).toEqual([
      ['i', 'long'],
      ['gh', 'silent'],
    ])
    expect(q(12, 'eight')).toEqual([])
    expect(ex(12, 'eight')).toBeUndefined()
  })

  it('#13 y cuối: happy → /i/; standby là ngoại lệ', () => {
    expect(q(13, 'happy')[0].answer).toBe('i')
    expect(ex(13, 'standby')).toBeTruthy()
  })

  it('#14 e cuối: promise câm, recipe ngoại lệ, fire không xét', () => {
    expect(q(14, 'promise')[0].answer).toBe('silent')
    expect(ex(14, 'recipe')).toBeTruthy()
    expect(q(14, 'fire')).toEqual([])
    expect(ex(14, 'fire')).toBeUndefined()
  })
})

describe('markSegments', () => {
  it('tô cả cụm, gạch chân riêng chữ được hỏi', () => {
    expect(markSegments('night', 2, 4, [1, 4])).toEqual([
      { text: 'n', cluster: false, asked: false },
      { text: 'i', cluster: true, asked: false },
      { text: 'gh', cluster: true, asked: true },
      { text: 't', cluster: false, asked: false },
    ])
  })

  it('không có cụm thì chỉ chữ được hỏi', () => {
    expect(markSegments('knife', 0, 1)).toEqual([
      { text: 'k', cluster: true, asked: true },
      { text: 'nife', cluster: false, asked: false },
    ])
  })
})

describe('pickQuestion', () => {
  it('lọc theo quy tắc và không hỏi lại từ vừa hỏi', () => {
    const pick = pickQuestion(bank.questions, [10], ['city', 'cat'], () => 0, () => 0)
    expect(pick).toMatchObject({ ruleId: 10, word: 'cold' })
  })

  it('hết câu thì trả về null', () => {
    expect(pickQuestion(bank.questions, [5], ['watch'], () => 0)).toBeNull()
  })
})

describe('thống kê Áp dụng', () => {
  it('recordQuiz cộng dồn, weaknessOf là tỉ lệ sai gần đây', () => {
    let s = recordQuiz(undefined, true)
    s = recordQuiz(s, false)
    expect(s).toMatchObject({ correct: 1, wrong: 1, recent: [true, false] })
    expect(weaknessOf(s)).toBe(0.5)
    expect(weaknessOf(undefined)).toBe(0.5)
  })
})
