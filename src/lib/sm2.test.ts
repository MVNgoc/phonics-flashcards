import { describe, it, expect } from 'vitest'
import {
  addDays,
  buildQueue,
  computeStats,
  daysBetween,
  isLearned,
  newReviewState,
  review,
} from './sm2'
import type { Phoneme, ReviewState } from './types'

const TODAY = '2026-07-31'

function state(partial: Partial<ReviewState> = {}): ReviewState {
  return { ...newReviewState(), ...partial }
}

describe('date helpers', () => {
  it('adds days across a month boundary', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('measures signed distance between dates', () => {
    expect(daysBetween(TODAY, '2026-08-03')).toBe(3)
    expect(daysBetween('2026-08-03', TODAY)).toBe(-3)
    expect(daysBetween(TODAY, TODAY)).toBe(0)
  })
})

describe('ease factor', () => {
  it('grade 4 leaves ease unchanged', () => {
    expect(review(state(), 4, TODAY).easeFactor).toBeCloseTo(2.5, 10)
  })

  it('grade 5 raises ease by 0.1', () => {
    expect(review(state(), 5, TODAY).easeFactor).toBeCloseTo(2.6, 10)
  })

  it('grade 3 lowers ease by 0.14', () => {
    expect(review(state(), 3, TODAY).easeFactor).toBeCloseTo(2.36, 10)
  })

  it('grade 1 lowers ease by 0.54', () => {
    expect(review(state(), 1, TODAY).easeFactor).toBeCloseTo(1.96, 10)
  })

  it('never drops below 1.3', () => {
    let s = state({ easeFactor: 1.3 })
    for (let i = 0; i < 5; i++) s = review(s, 1, TODAY)
    expect(s.easeFactor).toBe(1.3)
  })
})

describe('intervals on a pass', () => {
  it('first correct answer schedules 1 day out', () => {
    const s = review(state(), 4, TODAY)
    expect(s.repetitions).toBe(1)
    expect(s.interval).toBe(1)
    expect(s.nextDue).toBe('2026-08-01')
  })

  it('second correct answer schedules 6 days out', () => {
    const s = review(review(state(), 4, TODAY), 4, '2026-08-01')
    expect(s.repetitions).toBe(2)
    expect(s.interval).toBe(6)
    expect(s.nextDue).toBe('2026-08-07')
  })

  it('third and later answers multiply the interval by the new ease', () => {
    const s = review(state({ repetitions: 2, interval: 6, easeFactor: 2.5 }), 4, TODAY)
    expect(s.repetitions).toBe(3)
    expect(s.interval).toBe(15) // round(6 * 2.5)
    expect(s.nextDue).toBe('2026-08-15')
  })

  it('uses the updated ease, not the old one', () => {
    const s = review(state({ repetitions: 3, interval: 10, easeFactor: 2.5 }), 5, TODAY)
    expect(s.easeFactor).toBeCloseTo(2.6, 10)
    expect(s.interval).toBe(26) // round(10 * 2.6)
  })

  it('counts a pass as correct', () => {
    const s = review(state({ correctCount: 2 }), 3, TODAY)
    expect(s.correctCount).toBe(3)
    expect(s.wrongCount).toBe(0)
  })
})

describe('intervals on a fail', () => {
  it('resets repetitions and interval', () => {
    const s = review(state({ repetitions: 5, interval: 30 }), 1, TODAY)
    expect(s.repetitions).toBe(0)
    expect(s.interval).toBe(1)
    expect(s.nextDue).toBe('2026-08-01')
  })

  it('counts a fail as wrong and records the review date', () => {
    const s = review(state({ wrongCount: 1 }), 1, TODAY)
    expect(s.wrongCount).toBe(2)
    expect(s.correctCount).toBe(0)
    expect(s.lastReviewed).toBe(TODAY)
  })
})

describe('isLearned', () => {
  it('needs both 3 repetitions and a 7+ day interval', () => {
    expect(isLearned(state({ repetitions: 3, interval: 7 }))).toBe(true)
    expect(isLearned(state({ repetitions: 2, interval: 30 }))).toBe(false)
    expect(isLearned(state({ repetitions: 6, interval: 6 }))).toBe(false)
  })

  it('a wrong answer un-learns a card (repetitions reset)', () => {
    const learned = state({ repetitions: 4, interval: 20 })
    expect(isLearned(learned)).toBe(true)
    expect(isLearned(review(learned, 1, TODAY))).toBe(false)
  })
})

describe('buildQueue', () => {
  const phonemes: Phoneme[] = [
    {
      id: 'p1',
      note: 'a ngắn',
      type: 'vowel',
      graphemes: [
        { id: 'soon2', spelling: 'a', examples: [], review: state({ nextDue: '2026-08-02' }) },
        { id: 'new', spelling: 'ai', examples: [], review: state() },
        { id: 'late5', spelling: 'au', examples: [], review: state({ nextDue: '2026-07-26' }) },
      ],
    },
    {
      id: 'p2',
      note: 'âm b',
      type: 'consonant',
      graphemes: [
        { id: 'late1', spelling: 'b', examples: [], review: state({ nextDue: '2026-07-30' }) },
        { id: 'today', spelling: 'bb', examples: [], review: state({ nextDue: TODAY }) },
        { id: 'far', spelling: 'be', examples: [], review: state({ nextDue: '2026-09-01' }) },
        { id: 'soon1', spelling: 'bh', examples: [], review: state({ nextDue: '2026-08-01' }) },
      ],
    },
  ]

  const ids = buildQueue(phonemes, TODAY).map((c) => c.graphemeId)

  it('orders overdue first (most overdue leading), then new, then due soon', () => {
    expect(ids).toEqual(['late5', 'late1', 'today', 'new', 'soon1', 'soon2'])
  })

  it('leaves out cards due more than 3 days out', () => {
    expect(ids).not.toContain('far')
  })

  it('returns nothing when there are no cards', () => {
    expect(buildQueue([], TODAY)).toEqual([])
  })
})

describe('computeStats', () => {
  const phonemes: Phoneme[] = [
    {
      id: 'p1',
      note: 'a ngắn',
      type: 'vowel',
      graphemes: [
        {
          id: 'g1',
          spelling: 'a',
          examples: [],
          review: state({ repetitions: 4, interval: 20, nextDue: '2026-09-01', wrongCount: 3 }),
        },
        { id: 'g2', spelling: 'ai', examples: [], review: state({ wrongCount: 1 }) },
        {
          id: 'g3',
          spelling: 'au',
          examples: [],
          review: state({ repetitions: 1, interval: 1, nextDue: TODAY }),
        },
        {
          id: 'g4',
          spelling: 'ough',
          examples: [],
          review: state({ repetitions: 3, interval: 8, nextDue: '2026-08-08' }),
        },
      ],
    },
  ]

  const s = computeStats(phonemes, TODAY)

  it('computes the learned percentage', () => {
    expect(s.total).toBe(4)
    expect(s.learned).toBe(2)
    expect(s.percent).toBe(50)
  })

  it('counts new and due-today cards as due', () => {
    expect(s.dueToday).toBe(2) // g2 (new) + g3 (due today)
  })

  it('ranks the most-missed graphemes', () => {
    expect(s.worst.map((w) => w.spelling)).toEqual(['a', 'ai'])
    expect(s.worst[0].wrongCount).toBe(3)
    expect(s.worst[0].group).toBe('a ngắn')
  })

  it('reports 0% for an empty deck instead of NaN', () => {
    expect(computeStats([], TODAY).percent).toBe(0)
  })
})
