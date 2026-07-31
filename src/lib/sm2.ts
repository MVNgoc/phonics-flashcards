import type { Phoneme, Grapheme, ReviewState } from './types'

/** Self-rating buttons map to SM-2 grades (Anki-style). */
export type Grade = 1 | 3 | 4 | 5

export const GRADES: { grade: Grade; label: string; key: string; color: string }[] = [
  { grade: 1, label: 'Sai', key: '1', color: 'bg-rose-600 hover:bg-rose-500' },
  { grade: 3, label: 'Khó', key: '2', color: 'bg-amber-600 hover:bg-amber-500' },
  { grade: 4, label: 'Tốt', key: '3', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { grade: 5, label: 'Dễ', key: '4', color: 'bg-sky-600 hover:bg-sky-500' },
]

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
