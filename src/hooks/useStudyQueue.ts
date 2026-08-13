import { useCallback, useMemo, useState } from 'react'
import { buildGroupQueue, gradeFromTyping, normalize, todayISO, type Grade } from '../lib/sm2'
import type { Grapheme, Phoneme } from '../lib/types'
import { useStore } from './useStore'

/** 'answer' = đang gõ trường hợp / ví dụ, 'summary' = xem đáp án rồi chấm. */
export type Phase = 'answer' | 'summary'

export type MatchResult = 'hit' | 'dup' | 'miss'

export interface GraphemeOutcome {
  grapheme: Grapheme
  spellingFound: boolean
  examplesFound: string[]
  grade: Grade
}

/** Trường hợp đã gõ đúng nhưng chưa gõ được ví dụ nào — còn nợ ví dụ. */
function needsExample(g: Grapheme, examplesFound: Record<string, string[]>): boolean {
  return g.examples.length > 0 && (examplesFound[g.id] ?? []).length === 0
}

/** Chỉ xong khi đủ trường hợp *và* không còn trường hợp nào nợ ví dụ. */
function isGroupDone(
  group: Phoneme,
  found: string[],
  examplesFound: Record<string, string[]>,
): boolean {
  return (
    found.length === group.graphemes.length &&
    group.graphemes.every((g) => !needsExample(g, examplesFound))
  )
}

/**
 * Một phiên học. Đơn vị là một âm và luồng gõ xen kẽ:
 * gõ đúng một trường hợp -> hỏi ngay ví dụ cho đúng trường hợp đó -> quay lại gõ
 * trường hợp tiếp. Gõ sai thì không hỏi ví dụ. Bỏ qua ví dụ thì trường hợp đó
 * vẫn còn nợ, quay lại gõ ví dụ lúc nào cũng được cho tới khi xem đáp án.
 * Điểm suy ra từ những gì đã gõ.
 */
export function useStudyQueue() {
  const { data, gradeCard } = useStore()
  const today = useMemo(() => todayISO(), [])

  const [queue, setQueue] = useState<string[]>(() => buildGroupQueue(data.phonemes, today))
  const [phase, setPhase] = useState<Phase>('answer')
  /** Trường hợp đang được hỏi ví dụ; null = đang hỏi trường hợp. */
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const [examplesFound, setExamplesFound] = useState<Record<string, string[]>>({})
  const [reviewed, setReviewed] = useState(0)

  const group: Phoneme | null = data.phonemes.find((p) => p.id === queue[0]) ?? null
  const pending = pendingId ? (group?.graphemes.find((g) => g.id === pendingId) ?? null) : null

  const submitSpelling = useCallback(
    (text: string): MatchResult => {
      const n = normalize(text)
      if (!group || !n) return 'miss'
      const hit = group.graphemes.find((g) => normalize(g.spelling) === n)
      if (!hit) {
        setRejected((r) => (r.includes(n) ? r : [...r, n]))
        return 'miss'
      }
      if (found.includes(hit.id)) return 'dup'

      const nextFound = [...found, hit.id]
      setFound(nextFound)
      if (hit.examples.length > 0) {
        // Đúng -> hỏi ví dụ cho chính trường hợp này.
        setPendingId(hit.id)
      } else if (isGroupDone(group, nextFound, examplesFound)) {
        setPhase('summary')
      }
      return 'hit'
    },
    [group, found, examplesFound],
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
   * Chưa nghĩ ra ví dụ: quay lại gõ trường hợp, trường hợp này vẫn nằm trong
   * danh sách nợ ví dụ để gõ bù sau.
   */
  const skipExamples = useCallback(() => {
    if (!group) return
    setPendingId(null)
    if (isGroupDone(group, found, examplesFound)) setPhase('summary')
  }, [group, found, examplesFound])

  /** Gõ bù ví dụ cho một trường hợp đã đúng trước đó. */
  const revisitExamples = useCallback(
    (graphemeId: string) => {
      if (!group || !found.includes(graphemeId)) return
      const g = group.graphemes.find((x) => x.id === graphemeId)
      if (!g || g.examples.length === 0) return
      setPendingId(graphemeId)
    },
    [group, found],
  )

  /** Bỏ cuộc phần còn lại của nhóm và xem đáp án. */
  const finish = useCallback(() => {
    setPendingId(null)
    setPhase('summary')
  }, [])

  /** Kết quả từng trường hợp, cập nhật ngay theo những gì đã gõ. */
  const outcomes: GraphemeOutcome[] = useMemo(() => {
    if (!group) return []
    return group.graphemes.map((g) => {
      const spellingFound = found.includes(g.id)
      const hits = examplesFound[g.id] ?? []
      return {
        grapheme: g,
        spellingFound,
        examplesFound: hits,
        grade: gradeFromTyping({
          spellingFound,
          hasExamples: g.examples.length > 0,
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
    for (const o of outcomes) gradeCard(group.id, o.grapheme.id, o.grade, today)
    const needsRepeat = outcomes.some((o) => o.grade < 4)
    setQueue((q) => (needsRepeat ? [...q.slice(1), q[0]] : q.slice(1)))
    setReviewed((n) => n + 1)
    reset()
  }, [group, outcomes, gradeCard, today, reset])

  /**
   * Luyện lại khi hôm nay đã hết thẻ: hỏi cả những nhóm đã chấm trong ngày. Ôn
   * thêm không đẩy lịch tiếp (xem `review`) nên đây là luyện tay, không tính
   * vào tiến độ.
   */
  const restart = useCallback(() => {
    setQueue(buildGroupQueue(data.phonemes, today, Math.random, { skipDoneToday: false }))
    setReviewed(0)
    reset()
  }, [data.phonemes, today, reset])

  return {
    group,
    phase,
    pending,
    outcomes,
    rejected,
    foundCount: found.length,
    allFound: group ? found.length === group.graphemes.length : false,
    remaining: queue.length,
    reviewed,
    submitSpelling,
    submitExample,
    skipExamples,
    revisitExamples,
    finish,
    commit,
    restart,
    today,
  }
}
