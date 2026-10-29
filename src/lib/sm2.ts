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
    recent: [],
  }
}

/** Số ngày ôn gần nhất giữ lại kết quả, để thống kê trường hợp đang yếu. */
export const RECENT_DAYS = 10

/** Chặn interval để nextDue không bay đi vài năm (và không tràn ngày hợp lệ). */
export const MAX_INTERVAL = 365

/**
 * SM-2 update. Ease is always adjusted by the grade; only repetitions/interval
 * branch on pass (grade >= 3) vs fail.
 *
 * Chấm lại trong cùng một ngày (nhóm bị hỏi lại trong một phiên) thì lần đúng
 * thứ hai trở đi KHÔNG đẩy lịch tiếp: nếu không, mỗi vòng nhắc lại lại nhân
 * interval lên, một trường hợp có thể "đã thuộc" chỉ sau một buổi và nextDue
 * nhảy đi vài năm. Sai thì vẫn tính lại lịch (quên là quên) nhưng ease chỉ bị
 * trừ một lần trong ngày, để luyện nhiều vòng không đẩy ease xuống sàn 1.3.
 * `recent` cũng chỉ ghi lần trả lời đầu tiên trong ngày, để hỏi lại nhiều vòng
 * không bị đếm thành nhiều lần sai.
 */
export function review(state: ReviewState, grade: Grade, today: string): ReviewState {
  const q = grade
  const sameDay = state.lastReviewed === today
  if (sameDay && q >= 3) {
    return { ...state, correctCount: state.correctCount + 1 }
  }

  const easeFactor = sameDay
    ? state.easeFactor
    : Math.max(1.3, state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  let repetitions: number
  let interval: number

  if (q >= 3) {
    repetitions = state.repetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.min(MAX_INTERVAL, Math.round(state.interval * easeFactor))
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
    recent: sameDay ? (state.recent ?? []) : [...(state.recent ?? []), q >= 3].slice(-RECENT_DAYS),
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

/** Nguồn ngẫu nhiên, tách ra được để test deterministic. */
export type Rng = () => number

/** Fisher-Yates, trả về mảng mới. */
function shuffled<T>(items: T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Priority: overdue/due today -> brand new cards -> due within the next 1-3 days.
 * Cards due further out are left out of the session.
 *
 * Trong cùng một mức ưu tiên thì thứ tự là ngẫu nhiên: xáo trước rồi mới sort
 * theo số ngày. Array.sort ổn định (ES2019) nên "quá hạn lâu nhất lên trước" vẫn
 * đúng, chỉ những thẻ bằng nhau về số ngày mới đổi chỗ cho nhau.
 */
export function buildQueue(
  phonemes: Phoneme[],
  today: string,
  rng: Rng = Math.random,
): QueueCard[] {
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

  const overdueOrder = shuffled(overdue, rng).sort((a, b) => b.lateBy - a.lateBy)
  const soonOrder = shuffled(soon, rng).sort((a, b) => a.inDays - b.inDays)

  return [
    ...overdueOrder.map((x) => x.card),
    ...shuffled(fresh, rng),
    ...soonOrder.map((x) => x.card),
  ]
}

export interface QueueOptions {
  /**
   * Bỏ những trường hợp đã chấm trong hôm nay. Mặc định bật: chấm lại trong
   * ngày không đẩy lịch thêm (xem `review`), nên hỏi lại chỉ làm mất thời gian
   * và có thể làm tụt tiến độ. Nhờ suy ra từ `lastReviewed` mà reload trang
   * không làm nhóm đã học xong hôm nay quay lại hàng đợi.
   */
  skipDoneToday?: boolean
}

/** Một nhóm để xếp hàng ôn: id + lịch ôn của mọi đáp án trong nhóm. */
export interface ReviewGroup {
  id: string
  reviews: ReviewState[]
}

/**
 * Study unit is a whole group: the group inherits the priority of its most
 * urgent card. Dùng chung cho cả hai chiều học (xem deck.ts).
 */
export function buildReviewQueue(
  groups: ReviewGroup[],
  today: string,
  rng: Rng = Math.random,
  { skipDoneToday = true }: QueueOptions = {},
): string[] {
  // (bucket, key) càng nhỏ càng gấp. bucket 0 = quá hạn, 1 = mới, 2 = sắp đến hạn.
  const ranked: { id: string; bucket: number; key: number }[] = []

  for (const grp of groups) {
    let best: { bucket: number; key: number } | null = null
    for (const r of grp.reviews) {
      if (skipDoneToday && r.lastReviewed === today) continue
      const due = r.nextDue
      let cur: { bucket: number; key: number } | null = null
      if (due === null) {
        cur = { bucket: 1, key: 0 }
      } else {
        const inDays = daysBetween(today, due)
        if (inDays <= 0) cur = { bucket: 0, key: inDays } // càng âm càng quá hạn lâu
        else if (inDays <= 3) cur = { bucket: 2, key: inDays }
      }
      if (cur && (!best || cur.bucket < best.bucket || (cur.bucket === best.bucket && cur.key < best.key))) {
        best = cur
      }
    }
    if (best) ranked.push({ id: grp.id, ...best })
  }

  // Xáo trước, sort sau: cùng mức ưu tiên thì ngẫu nhiên, khác mức thì giữ đúng thứ tự.
  return shuffled(ranked, rng)
    .sort((a, b) => a.bucket - b.bucket || a.key - b.key)
    .map((x) => x.id)
}

/** Hàng đợi chiều xuôi: mỗi âm là một nhóm. */
export function buildGroupQueue(
  phonemes: Phoneme[],
  today: string,
  rng: Rng = Math.random,
  options: QueueOptions = {},
): string[] {
  return buildReviewQueue(
    phonemes.map((p) => ({ id: p.id, reviews: p.graphemes.map((g) => g.review) })),
    today,
    rng,
    options,
  )
}

// ---------- aggregate stats ----------

export interface Stats {
  total: number
  learned: number
  percent: number
  dueToday: number
}

export function computeStats(phonemes: Phoneme[], today: string): Stats {
  const all: { p: Phoneme; g: Grapheme }[] = phonemes.flatMap((p) =>
    p.graphemes.map((g) => ({ p, g })),
  )
  const learned = all.filter((x) => isLearned(x.g.review)).length
  const dueToday = all.filter((x) => isDue(x.g.review, today)).length

  return {
    total: all.length,
    learned,
    percent: all.length === 0 ? 0 : Math.round((learned / all.length) * 100),
    dueToday,
  }
}
