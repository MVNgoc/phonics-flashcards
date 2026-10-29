import { useCallback, useEffect, useMemo, useState } from 'react'
import { gradeFromTyping, normalize, todayISO, type Grade } from '../lib/sm2'
import {
  buildDeck,
  buildDeckQueue,
  matchAnswer,
  type DeckGroup,
  type DeckItem,
  type Direction,
} from '../lib/deck'
import { useStore } from './useStore'

/** 'answer' = đang gõ trường hợp / ví dụ, 'summary' = xem đáp án rồi chấm. */
export type Phase = 'answer' | 'summary'

export type MatchResult = 'hit' | 'dup' | 'miss'

export interface ItemOutcome {
  item: DeckItem
  /** Đã gõ đúng đáp án (cách viết ở chiều xuôi, âm ở chiều ngược). */
  found: boolean
  examplesFound: string[]
  grade: Grade
}

/** Đáp án đã gõ đúng nhưng chưa gõ được ví dụ nào — còn nợ ví dụ. */
function needsExample(item: DeckItem, examplesFound: Record<string, string[]>): boolean {
  return item.examples.length > 0 && (examplesFound[item.id] ?? []).length === 0
}

/** Chỉ xong khi đủ trường hợp *và* không còn trường hợp nào nợ ví dụ. */
function isGroupDone(
  group: DeckGroup,
  found: string[],
  examplesFound: Record<string, string[]>,
): boolean {
  return (
    found.length === group.items.length &&
    group.items.every((i) => !needsExample(i, examplesFound))
  )
}

/** Trạng thái một phiên học, đủ để dựng lại đúng thẻ đang gõ dở. */
interface SessionSnapshot {
  today: string
  queue: string[]
  phase: Phase
  pendingId: string | null
  found: string[]
  rejected: string[]
  examplesFound: Record<string, string[]>
  reviewed: number
}

/**
 * Phiên đang học của từng chiều. Sang trang khác thì StudyPage unmount, giữ ở
 * đây để quay lại vẫn đúng thẻ đang học thay vì xáo hàng đợi mới. Chỉ sống
 * trong bộ nhớ: reload trang thì bắt đầu phiên mới.
 */
const sessions: Partial<Record<Direction, SessionSnapshot>> = {}

/**
 * Lấy lại phiên đã lưu, khớp với bộ thẻ hiện tại: bỏ nhóm đã bị xoá, thêm nhóm
 * mới đến hạn (vd. vừa thêm âm ở trang Quản lý). Nhóm đang học bị sửa thì chỉ
 * giữ những đáp án còn tồn tại; nhóm đang học bị xoá thì bắt đầu lại từ đầu.
 */
function restoreSession(direction: Direction, deck: DeckGroup[], today: string): SessionSnapshot | null {
  const saved = sessions[direction]
  if (!saved || saved.today !== today) return null

  const ids = new Set(deck.map((g) => g.id))
  const queue = saved.queue.filter((id) => ids.has(id))
  for (const id of buildDeckQueue(deck, today)) if (!queue.includes(id)) queue.push(id)

  const group = deck.find((g) => g.id === saved.queue[0])
  if (!group || queue[0] !== group.id) {
    return { ...saved, queue, phase: 'answer', pendingId: null, found: [], rejected: [], examplesFound: {} }
  }
  const itemIds = new Set(group.items.map((i) => i.id))
  return {
    ...saved,
    queue,
    pendingId: saved.pendingId && itemIds.has(saved.pendingId) ? saved.pendingId : null,
    found: saved.found.filter((id) => itemIds.has(id)),
  }
}

/**
 * Một phiên học. Đơn vị là một thẻ (một âm ở chiều xuôi, một cách viết ở chiều
 * ngược) và luồng gõ xen kẽ: gõ đúng một đáp án -> hỏi ngay ví dụ cho đúng đáp
 * án đó -> quay lại gõ đáp án tiếp. Gõ sai thì không hỏi ví dụ. Bỏ qua ví dụ
 * thì đáp án đó vẫn còn nợ, quay lại gõ ví dụ lúc nào cũng được cho tới khi xem
 * đáp án. Điểm suy ra từ những gì đã gõ.
 *
 * Đổi chiều học thì mount lại hook (StudyPage đặt `key`), không đổi giữa chừng.
 * Mỗi chiều giữ phiên riêng (xem `sessions`), quay lại chiều cũ vẫn đúng thẻ cũ.
 */
export function useStudyQueue(direction: Direction = 'forward') {
  const { data, gradeCard } = useStore()
  const today = useMemo(() => todayISO(), [])
  const deck = useMemo(() => buildDeck(data.phonemes, direction), [data.phonemes, direction])

  const [restored] = useState(() => restoreSession(direction, deck, today))
  const [queue, setQueue] = useState<string[]>(() => restored?.queue ?? buildDeckQueue(deck, today))
  const [phase, setPhase] = useState<Phase>(restored?.phase ?? 'answer')
  /** Đáp án đang được hỏi ví dụ; null = đang hỏi đáp án. */
  const [pendingId, setPendingId] = useState<string | null>(restored?.pendingId ?? null)
  const [found, setFound] = useState<string[]>(restored?.found ?? [])
  const [rejected, setRejected] = useState<string[]>(restored?.rejected ?? [])
  const [examplesFound, setExamplesFound] = useState<Record<string, string[]>>(
    restored?.examplesFound ?? {},
  )
  const [reviewed, setReviewed] = useState(restored?.reviewed ?? 0)

  useEffect(() => {
    sessions[direction] = { today, queue, phase, pendingId, found, rejected, examplesFound, reviewed }
  }, [direction, today, queue, phase, pendingId, found, rejected, examplesFound, reviewed])

  const group: DeckGroup | null = deck.find((g) => g.id === queue[0]) ?? null
  const pending = pendingId ? (group?.items.find((i) => i.id === pendingId) ?? null) : null

  const submitAnswer = useCallback(
    (text: string): MatchResult => {
      const n = normalize(text)
      if (!group || !n) return 'miss'
      const hit = matchAnswer(group, text, direction)
      if (!hit) {
        setRejected((r) => (r.includes(n) ? r : [...r, n]))
        return 'miss'
      }
      if (found.includes(hit.id)) return 'dup'

      const nextFound = [...found, hit.id]
      setFound(nextFound)
      if (hit.examples.length > 0) {
        // Đúng -> hỏi ví dụ cho chính đáp án này.
        setPendingId(hit.id)
      } else if (isGroupDone(group, nextFound, examplesFound)) {
        setPhase('summary')
      }
      return 'hit'
    },
    [group, found, examplesFound, direction],
  )

  const submitExample = useCallback(
    (text: string): MatchResult => {
      const n = normalize(text)
      if (!group || !pending || !n) return 'miss'
      const hit = pending.examples.find((ex) => normalize(ex) === n)
      if (!hit) return 'miss'
      const already = examplesFound[pending.id] ?? []
      if (already.includes(hit)) return 'dup'

      const nextExamples = { ...examplesFound, [pending.id]: [...already, hit] }
      setExamplesFound(nextExamples)
      // Một ví dụ đúng là đủ — seed nhiều ví dụ chỉ để có nhiều đáp án chấp nhận
      // được, không bắt gõ hết.
      setPendingId(null)
      if (isGroupDone(group, found, nextExamples)) setPhase('summary')
      return 'hit'
    },
    [group, pending, examplesFound, found],
  )

  /**
   * Chưa nghĩ ra ví dụ: quay lại gõ đáp án, đáp án này vẫn nằm trong
   * danh sách nợ ví dụ để gõ bù sau.
   */
  const skipExamples = useCallback(() => {
    if (!group) return
    setPendingId(null)
    if (isGroupDone(group, found, examplesFound)) setPhase('summary')
  }, [group, found, examplesFound])

  /** Gõ bù ví dụ cho một đáp án đã đúng trước đó. */
  const revisitExamples = useCallback(
    (itemId: string) => {
      if (!group || !found.includes(itemId)) return
      const item = group.items.find((x) => x.id === itemId)
      if (!item || item.examples.length === 0) return
      setPendingId(itemId)
    },
    [group, found],
  )

  /** Bỏ cuộc phần còn lại của nhóm và xem đáp án. */
  const finish = useCallback(() => {
    setPendingId(null)
    setPhase('summary')
  }, [])

  /** Kết quả từng đáp án, cập nhật ngay theo những gì đã gõ. */
  const outcomes: ItemOutcome[] = useMemo(() => {
    if (!group) return []
    return group.items.map((item) => {
      const isFound = found.includes(item.id)
      const hits = examplesFound[item.id] ?? []
      return {
        item,
        found: isFound,
        examplesFound: hits,
        grade: gradeFromTyping({
          spellingFound: isFound,
          hasExamples: item.examples.length > 0,
          examplesFound: hits.length,
        }),
      }
    })
  }, [group, found, examplesFound])

  const reset = useCallback(() => {
    setPhase('answer')
    setPendingId(null)
    setFound([])
    setRejected([])
    setExamplesFound({})
  }, [])

  const commit = useCallback(() => {
    if (!group) return
    for (const o of outcomes) {
      for (const ref of o.item.refs) gradeCard(ref.phonemeId, ref.graphemeId, o.grade, today, direction)
    }
    const needsRepeat = outcomes.some((o) => o.grade < 4)
    setQueue((q) => (needsRepeat ? [...q.slice(1), q[0]] : q.slice(1)))
    setReviewed((n) => n + 1)
    reset()
  }, [group, outcomes, gradeCard, today, direction, reset])

  /**
   * Luyện lại khi hôm nay đã hết thẻ: hỏi cả những nhóm đã chấm trong ngày. Ôn
   * thêm không đẩy lịch tiếp (xem `review`) nên đây là luyện tay, không tính
   * vào tiến độ.
   */
  const restart = useCallback(() => {
    setQueue(buildDeckQueue(deck, today, Math.random, { skipDoneToday: false }))
    setReviewed(0)
    reset()
  }, [deck, today, reset])

  return {
    group,
    phase,
    pending,
    outcomes,
    rejected,
    foundCount: found.length,
    allFound: group ? found.length === group.items.length : false,
    remaining: queue.length,
    reviewed,
    submitAnswer,
    submitExample,
    skipExamples,
    revisitExamples,
    finish,
    commit,
    restart,
    today,
  }
}
