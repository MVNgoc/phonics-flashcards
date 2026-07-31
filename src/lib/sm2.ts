import type { Phoneme, Grapheme, ReviewState } from './types'

/** Anki-style grade scale. Auto-grading only emits 1 / 3 / 4; 5 stays supported. */
export type Grade = 1 | 3 | 4 | 5

export const GRADE_LABEL: Record<Grade, string> = { 1: 'Sai', 3: 'Khó', 4: 'Tốt', 5: 'Dễ' }

/** Typed answers are matched case-insensitively, ignoring surrounding spaces. */
export function normalize(text: string): string {
  return text.trim().toLowerCase()
}

/**
 * Auto-grade one grapheme from what the user typed:
 * missed the spelling -> 1, got the spelling but no example -> 3, otherwise 4.
 * A grapheme with no stored examples can't be penalised for examples.
 */
export function gradeFromTyping(input: {
  spellingFound: boolean
  hasExamples: boolean
  examplesFound: number
}): Grade {
  if (!input.spellingFound) return 1
  if (input.hasExamples && input.examplesFound === 0) return 3
  return 4
}

// ---------- date helpers (ISO date-only strings, no timezone surprises) ----------

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** Positive = still in the future, negative = overdue by that many days. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

// ---------- SM-2 ----------

export function newReviewState(): ReviewState {
  return {
    lastReviewed: null,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextDue: null,
    correctCount: 0,
    wrongCount: 0,
  }
}

/**
 * SM-2 update. Ease is always adjusted by the grade; only repetitions/interval
 * branch on pass (grade >= 3) vs fail.
 */
export function review(state: ReviewState, grade: Grade, today: string): ReviewState {
  const q = grade
  const easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  let repetitions: number
  let interval: number

  if (q >= 3) {
    repetitions = state.repetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(state.interval * easeFactor)
  } else {
    repetitions = 0
    interval = 1
  }

  return {
    lastReviewed: today,
    interval,
    easeFactor,
    repetitions,
    nextDue: addDays(today, interval),
    correctCount: state.correctCount + (q >= 3 ? 1 : 0),
    wrongCount: state.wrongCount + (q >= 3 ? 0 : 1),
  }
}

/** "Thuộc" = repetitions >= 3 and interval >= 7 days. */
export function isLearned(state: ReviewState): boolean {
  return state.repetitions >= 3 && state.interval >= 7
}

export function isNew(state: ReviewState): boolean {
  return state.nextDue === null
}

export function isDue(state: ReviewState, today: string): boolean {
  if (state.nextDue === null) return true
  return daysBetween(state.nextDue, today) >= 0
}

// ---------- study queue ----------

export interface QueueCard {
  phonemeId: string
  graphemeId: string
}

/**
 * Priority: overdue/due today -> brand new cards -> due within the next 1-3 days.
 * Cards due further out are left out of the session.
 */
export function buildQueue(phonemes: Phoneme[], today: string): QueueCard[] {
  const overdue: { card: QueueCard; lateBy: number }[] = []
  const fresh: QueueCard[] = []
  const soon: { card: QueueCard; inDays: number }[] = []

  for (const p of phonemes) {
    for (const g of p.graphemes) {
      const card: QueueCard = { phonemeId: p.id, graphemeId: g.id }
      const due = g.review.nextDue
      if (due === null) {
        fresh.push(card)
        continue
      }
      const inDays = daysBetween(today, due) // negative = overdue
      if (inDays <= 0) overdue.push({ card, lateBy: -inDays })
      else if (inDays <= 3) soon.push({ card, inDays })
    }
  }

  overdue.sort((a, b) => b.lateBy - a.lateBy)
  soon.sort((a, b) => a.inDays - b.inDays)

  return [...overdue.map((x) => x.card), ...fresh, ...soon.map((x) => x.card)]
}

/**
 * Study unit is a whole sound group: the group inherits the priority of its most
 * urgent grapheme, so we can reuse buildQueue and just dedupe by phoneme.
 */
export function buildGroupQueue(phonemes: Phoneme[], today: string): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const card of buildQueue(phonemes, today)) {
    if (seen.has(card.phonemeId)) continue
    seen.add(card.phonemeId)
    order.push(card.phonemeId)
  }
  return order
}

// ---------- aggregate stats ----------

export interface Stats {
  total: number
  learned: number
  percent: number
  dueToday: number
  worst: { group: string; spelling: string; wrongCount: number }[]
}

export function computeStats(phonemes: Phoneme[], today: string): Stats {
  const all: { p: Phoneme; g: Grapheme }[] = phonemes.flatMap((p) =>
    p.graphemes.map((g) => ({ p, g })),
  )
  const learned = all.filter((x) => isLearned(x.g.review)).length
  const dueToday = all.filter((x) => isDue(x.g.review, today)).length
  const worst = all
    .filter((x) => x.g.review.wrongCount > 0)
    .sort((a, b) => b.g.review.wrongCount - a.g.review.wrongCount)
    .slice(0, 5)
    .map((x) => ({
      group: x.p.note ?? '',
      spelling: x.g.spelling,
      wrongCount: x.g.review.wrongCount,
    }))

  return {
    total: all.length,
    learned,
    percent: all.length === 0 ? 0 : Math.round((learned / all.length) * 100),
    dueToday,
    worst,
  }
}
