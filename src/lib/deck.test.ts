import { describe, it, expect } from 'vitest'
import type { AppData, Phoneme, PhonemeType, ReviewState } from './types'
import {
  buildDeckQueue,
  deckProgress,
  forwardDeck,
  matchAnswer,
  reverseDeck,
  reviewOf,
  weakestItems,
} from './deck'
import { buildGroupQueue, newReviewState } from './sm2'

const TODAY = '2026-10-21'
const noShuffle = () => 0

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

const phonemes = make([
  ['/i/', 'vowel', [['i', ['ship']], ['y', ['happy', 'lovely']]]],
  ['/igh/', 'vowel', [['igh', ['light']], ['y', ['sky']]]],
  ['Short /oo/', 'vowel', [['oo', ['book']], ['u', ['put']]]],
  ['Long /oo/', 'vowel', [['oo', ['zoo']], ['u', ['flu']]]],
  ['/s/', 'consonant', [['ce', ['ice']], ['ce (ce đứng cuối - e câm)', ['dance', 'ice']]]],
  ['', 'consonant', [['zz', ['buzz']]]],
])

const learned = (): ReviewState => ({ ...newReviewState(), repetitions: 3, interval: 10, nextDue: '2026-11-01' })

describe('forwardDeck', () => {
  it('mỗi âm một thẻ, mỗi trường hợp một đáp án — giữ y như trước', () => {
    const deck = forwardDeck(phonemes)
    expect(deck.map((g) => g.prompt)).toEqual(['/i/', '/igh/', 'Short /oo/', 'Long /oo/', '/s/', '(nhóm chưa có nhãn)'])
    expect(deck[0].kind).toBe('nguyên âm')
    expect(deck[0].items.map((i) => [i.id, i.answer])).toEqual([
      ['p0-g0', 'i'],
      ['p0-g1', 'y'],
    ])
    expect(deck[0].items[1].refs).toEqual([{ phonemeId: 'p0', graphemeId: 'p0-g1' }])
  })

  it('hàng đợi giống buildGroupQueue cũ', () => {
    expect(buildDeckQueue(forwardDeck(phonemes), TODAY, noShuffle)).toEqual(
      buildGroupQueue(phonemes, TODAY, noShuffle),
    )
  })
})

describe('reverseDeck', () => {
  const deck = reverseDeck(phonemes)
  const byPrompt = (p: string) => deck.find((g) => g.prompt === p)!

  it('mỗi cách viết một thẻ, đáp án là các âm nó tạo ra', () => {
    expect(byPrompt('y').items.map((i) => i.answer)).toEqual(['/i/', '/igh/'])
    expect(byPrompt('y').kind).toBe('cách viết')
    expect(byPrompt('igh').items.map((i) => i.answer)).toEqual(['/igh/'])
  })

  it('ví dụ của đáp án là ví dụ của đúng cặp cách viết – âm đó', () => {
    expect(byPrompt('y').items[0].examples).toEqual(['happy', 'lovely'])
    expect(byPrompt('y').items[1].examples).toEqual(['sky'])
  })

  it('hai trường hợp cùng cách viết trong một âm gộp thành một đáp án, chấm cả hai', () => {
    const ce = byPrompt('ce')
    expect(ce.items).toHaveLength(1)
    expect(ce.items[0].examples).toEqual(['ice', 'dance'])
    expect(ce.items[0].refs.map((r) => r.graphemeId)).toEqual(['p4-g0', 'p4-g1'])
  })

  it('âm chưa có nhãn thì không gõ được nên bỏ qua', () => {
    expect(deck.find((g) => g.prompt === 'zz')).toBeUndefined()
  })

  it('dùng tiến độ chiều ngược, không đụng tiến độ chiều xuôi', () => {
    const withProgress = phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map((g) => ({ ...g, review: learned() })),
    }))
    expect(deckProgress(reverseDeck(withProgress)).learned).toBe(0)
    expect(deckProgress(forwardDeck(withProgress)).learned).toBe(11)
  })

  it('chưa có reverseReview thì coi như thẻ mới', () => {
    expect(reviewOf(phonemes[0].graphemes[0], 'reverse')).toEqual(newReviewState())
  })
})

describe('deckProgress', () => {
  const answered = (repetitions: number): ReviewState => ({ ...newReviewState(), repetitions, interval: 6 })
  const withReviews = (reviews: Record<string, ReviewState>, field: 'review' | 'reverseReview') =>
    phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map((g) => (reviews[g.id] ? { ...g, [field]: reviews[g.id] } : g)),
    }))

  it('đang nhớ = đã trả lời đúng nhưng chưa thuộc, không tính vào %', () => {
    const data = withReviews(
      {
        'p0-g0': learned(),
        'p0-g1': answered(1),
        'p1-g0': answered(2),
        'p1-g1': { ...answered(0), wrongCount: 1 }, // vừa sai -> về 0, không còn "đang nhớ"
      },
      'review',
    )
    expect(deckProgress(forwardDeck(data))).toEqual({ total: 11, learned: 1, remembering: 2, percent: 9 })
  })

  it('đáp án gộp chỉ "đang nhớ" khi mọi trường hợp đều đã trả lời đúng', () => {
    const ce = (second: ReviewState) =>
      deckProgress(reverseDeck(withReviews({ 'p4-g0': learned(), 'p4-g1': second }, 'reverseReview')))
    expect(ce(answered(1))).toMatchObject({ learned: 0, remembering: 1 })
    expect(ce(answered(0))).toMatchObject({ learned: 0, remembering: 0 })
    expect(ce(learned())).toMatchObject({ learned: 1, remembering: 0 })
  })
})

describe('matchAnswer', () => {
  const fwd = forwardDeck(phonemes)
  const rev = reverseDeck(phonemes)
  const revCard = (p: string) => rev.find((g) => g.prompt === p)!

  it('chiều xuôi so cách viết như cũ', () => {
    expect(matchAnswer(fwd[0], ' Y ', 'forward')?.id).toBe('p0-g1')
    expect(matchAnswer(fwd[0], '/y/', 'forward')).toBeNull()
  })

  it('chiều ngược không cần gõ dấu "/"', () => {
    expect(matchAnswer(revCard('y'), 'igh', 'reverse')?.answer).toBe('/igh/')
    expect(matchAnswer(revCard('y'), '/I/', 'reverse')?.answer).toBe('/i/')
    expect(matchAnswer(revCard('y'), 'ai', 'reverse')).toBeNull()
  })

  it('Short / Long phải gõ rõ khi thẻ có cả hai', () => {
    expect(matchAnswer(revCard('oo'), 'short oo', 'reverse')?.answer).toBe('Short /oo/')
    expect(matchAnswer(revCard('oo'), 'Long /oo/', 'reverse')?.answer).toBe('Long /oo/')
    expect(matchAnswer(revCard('oo'), 'oo', 'reverse')).toBeNull()
  })

  it('gõ tắt được khi trong thẻ chỉ có một âm như vậy', () => {
    const only = reverseDeck(make([['Short /oo/', 'vowel', [['oo', ['book']]]]]))
    expect(matchAnswer(only[0], 'oo', 'reverse')?.answer).toBe('Short /oo/')
  })

  it('chữ rỗng không khớp gì', () => {
    expect(matchAnswer(revCard('y'), '  ', 'reverse')).toBeNull()
  })
})

describe('buildDeckQueue chiều ngược', () => {
  it('thẻ đã chấm hôm nay ở chiều ngược thì không hỏi lại', () => {
    const done: AppData['phonemes'] = phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map((g) =>
        g.spelling === 'y'
          ? { ...g, reverseReview: { ...newReviewState(), lastReviewed: TODAY, nextDue: '2026-10-22' } }
          : g,
      ),
    }))
    const queue = buildDeckQueue(reverseDeck(done), TODAY, noShuffle)
    expect(queue).not.toContain('rev:y')
    expect(queue).toContain('rev:igh')
    // Chiều xuôi không bị ảnh hưởng.
    expect(buildDeckQueue(forwardDeck(done), TODAY, noShuffle)).toContain('p0')
  })
})

describe('weakestItems', () => {
  const withRecent = (spec: Record<string, boolean[]>, field: 'review' | 'reverseReview', wrongCount = 0) =>
    phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map((g) =>
        spec[g.id] ? { ...g, [field]: { ...newReviewState(), recent: spec[g.id], wrongCount } } : g,
      ),
    }))

  it('xếp theo số lần sai gần đây, bỏ trường hợp không sai lần nào', () => {
    const data = withRecent(
      { 'p0-g0': [false, true, true], 'p1-g0': [false, false, true], 'p2-g0': [true, true] },
      'review',
    )
    expect(weakestItems(data, 'forward')).toEqual([
      { group: '/igh/', spelling: 'igh', wrong: 2, answered: 3 },
      { group: '/i/', spelling: 'i', wrong: 1, answered: 3 },
    ])
  })

  it('bằng số lần sai thì ôn ít ngày hơn (tỉ lệ sai cao hơn) đứng trước', () => {
    const data = withRecent({ 'p0-g0': [false, true, true, true], 'p1-g0': [false, true] }, 'review')
    expect(weakestItems(data, 'forward').map((w) => w.spelling)).toEqual(['igh', 'i'])
  })

  it('mỗi chiều tính riêng', () => {
    const data = withRecent({ 'p0-g1': [false] }, 'reverseReview')
    expect(weakestItems(data, 'forward')).toEqual([])
    expect(weakestItems(data, 'reverse')).toEqual([{ group: '/i/', spelling: 'y', wrong: 1, answered: 1 }])
  })

  it('chỉ có tổng số lần sai cũ (chưa có recent) thì không tính', () => {
    const data = phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map((g) => ({ ...g, review: { ...g.review, recent: undefined, wrongCount: 9 } })),
    }))
    expect(weakestItems(data, 'forward')).toEqual([])
  })

  it('giới hạn số trường hợp trả về', () => {
    const all = Object.fromEntries(phonemes.flatMap((p) => p.graphemes.map((g) => [g.id, [false]])))
    expect(weakestItems(withRecent(all, 'review'), 'forward')).toHaveLength(5)
  })
})
