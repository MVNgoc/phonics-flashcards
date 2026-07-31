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

/**
 * Một phiên học. Đơn vị là một âm và luồng gõ xen kẽ:
 * gõ đúng một trường hợp -> hỏi ngay ví dụ cho đúng trường hợp đó -> quay lại gõ
 * trường hợp tiếp. Gõ sai thì không hỏi ví dụ. Điểm suy ra từ những gì đã gõ.
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

      setFound([...found, hit.id])
      if (hit.examples.length > 0) {
        // Đúng -> hỏi ví dụ cho chính trường hợp này.
        setPendingId(hit.id)
      } else if (found.length + 1 === group.graphemes.length) {
        setPhase('summary')
      }
      return 'hit'
    },
    [group, found],
  )

  const submitExample = useCallback(
    (text: string): MatchResult => {
      const n = normalize(text)
      if (!group || !pending || !n) return 'miss'
      const hit = pending.examples.find((ex) => normalize(ex) === n)
      if (!hit) return 'miss'
      const already = examplesFound[pending.id] ?? []
      if (already.includes(hit)) return 'dup'

      setExamplesFound((m) => ({ ...m, [pending.id]: [...already, hit] }))
      if (already.length + 1 === pending.examples.length) {
        // Đã gõ hết ví dụ của trường hợp này -> quay lại gõ trường hợp.
        setPendingId(null)
        if (found.length === group.graphemes.length) setPhase('summary')
      }
      return 'hit'
    },
    [group, pending, examplesFound, found],
  )

  /** Thôi không gõ thêm ví dụ cho trường hợp hiện tại, quay lại gõ trường hợp. */
  const skipExamples = useCallback(() => {
    if (!group) return
    setPendingId(null)
    if (found.length === group.graphemes.length) setPhase('summary')
  }, [group, found])

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

  const restart = useCallback(() => {
    setQueue(buildGroupQueue(data.phonemes, today))
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
    remaining: queue.length,
    reviewed,
    submitSpelling,
    submitExample,
    skipExamples,
    finish,
    commit,
    restart,
    today,
  }
}
