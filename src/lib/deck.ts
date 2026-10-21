import type { Grapheme, Phoneme, ReviewState } from './types'
import { buildReviewQueue, isLearned, newReviewState, normalize, type QueueOptions, type Rng } from './sm2'
import { soundCore, soundKey, spellingKey } from './lookup'

/** forward = cho âm, gõ các cách viết; reverse = cho cách viết, gõ các âm. */
export type Direction = 'forward' | 'reverse'

/** Trường hợp trong data mà một đáp án ứng với — chấm điểm là chấm vào đây. */
export interface CardRef {
  phonemeId: string
  graphemeId: string
}

/** Một đáp án của thẻ: gõ đúng `answer` rồi gõ một trong `examples`. */
export interface DeckItem {
  id: string
  answer: string
  /** Cách viết và âm của cặp này, để hỏi "ví dụ dùng <spelling> đọc thành <sound>". */
  spelling: string
  sound: string
  examples: string[]
  refs: CardRef[]
  reviews: ReviewState[]
}

/** Một thẻ học: đề bài + mọi đáp án phải gõ ra. */
export interface DeckGroup {
  id: string
  prompt: string
  /** Nhãn nhỏ dưới đề bài. */
  kind: string
  items: DeckItem[]
}

export function reviewOf(g: Grapheme, direction: Direction): ReviewState {
  return direction === 'forward' ? g.review : (g.reverseReview ?? newReviewState())
}

/** Chiều xuôi: mỗi âm là một thẻ, mỗi trường hợp là một đáp án — y như trước giờ. */
export function forwardDeck(phonemes: Phoneme[]): DeckGroup[] {
  return phonemes.map((p) => ({
    id: p.id,
    prompt: p.note || '(nhóm chưa có nhãn)',
    kind: p.type === 'vowel' ? 'nguyên âm' : 'phụ âm',
    items: p.graphemes.map((g) => ({
      id: g.id,
      answer: g.spelling,
      spelling: g.spelling,
      sound: p.note ?? '',
      examples: g.examples,
      refs: [{ phonemeId: p.id, graphemeId: g.id }],
      reviews: [g.review],
    })),
  }))
}

/**
 * Chiều ngược: mỗi cách viết (đã bỏ chú thích) là một thẻ, các âm nó tạo ra là
 * đáp án. Hai trường hợp cùng cách viết trong một âm (vd "ce" và "ce (…)") gộp
 * thành một đáp án, ví dụ gộp lại, chấm cả hai. Âm chưa có nhãn thì không gõ
 * được nên bỏ qua.
 */
export function reverseDeck(phonemes: Phoneme[]): DeckGroup[] {
  const byKey = new Map<string, DeckGroup>()
  for (const p of phonemes) {
    const sound = p.note?.trim()
    if (!sound) continue
    for (const g of p.graphemes) {
      const key = spellingKey(g.spelling)
      if (!key) continue
      let group = byKey.get(key)
      if (!group) {
        group = { id: `rev:${key}`, prompt: key, kind: 'cách viết', items: [] }
        byKey.set(key, group)
      }
      const ref = { phonemeId: p.id, graphemeId: g.id }
      const itemId = `rev:${key}:${p.id}`
      const item = group.items.find((i) => i.id === itemId)
      if (item) {
        item.examples = [...new Set([...item.examples, ...g.examples])]
        item.refs.push(ref)
        item.reviews.push(reviewOf(g, 'reverse'))
      } else {
        group.items.push({
          id: itemId,
          answer: sound,
          spelling: key,
          sound,
          examples: [...g.examples],
          refs: [ref],
          reviews: [reviewOf(g, 'reverse')],
        })
      }
    }
  }
  return [...byKey.values()]
}

export function buildDeck(phonemes: Phoneme[], direction: Direction): DeckGroup[] {
  return direction === 'forward' ? forwardDeck(phonemes) : reverseDeck(phonemes)
}

export function buildDeckQueue(
  deck: DeckGroup[],
  today: string,
  rng: Rng = Math.random,
  options: QueueOptions = {},
): string[] {
  return buildReviewQueue(
    deck.map((g) => ({ id: g.id, reviews: g.items.flatMap((i) => i.reviews) })),
    today,
    rng,
    options,
  )
}

/**
 * Đáp án khớp với chữ vừa gõ. Chiều xuôi so cách viết như cũ. Chiều ngược so tên
 * âm, không cần gõ dấu "/": "ai" = "/ai/", "short oo" = "Short /oo/". Gõ tắt "oo"
 * chỉ được nhận khi trong thẻ chỉ có một âm như vậy, để không ăn cả Short lẫn Long.
 */
export function matchAnswer(group: DeckGroup, text: string, direction: Direction): DeckItem | null {
  if (direction === 'forward') {
    const n = normalize(text)
    if (!n) return null
    return group.items.find((i) => normalize(i.answer) === n) ?? null
  }
  const q = soundKey(text)
  if (!q) return null
  const exact = group.items.find((i) => soundKey(i.sound) === q)
  if (exact) return exact
  const byCore = group.items.filter((i) => soundCore(i.sound) === q)
  return byCore.length === 1 ? byCore[0] : null
}

export interface Progress {
  total: number
  learned: number
  percent: number
}

/** Số đáp án đã thuộc trên tổng số đáp án của cả bộ thẻ. */
export function deckProgress(deck: DeckGroup[]): Progress {
  const items = deck.flatMap((g) => g.items)
  const learned = items.filter((i) => i.reviews.every(isLearned)).length
  return {
    total: items.length,
    learned,
    percent: items.length === 0 ? 0 : Math.round((learned / items.length) * 100),
  }
}
