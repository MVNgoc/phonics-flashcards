import { useCallback, useMemo, useState } from 'react'
import {
  buildGroupQueue,
  gradeFromTyping,
  normalize,
  todayISO,
  type Grade,
} from '../lib/sm2'
import type { Grapheme, Phoneme } from '../lib/types'
import { useStore } from './useStore'

/** 'spell' = typing spellings, 'reveal' = answers shown + typing examples. */
export type Phase = 'spell' | 'reveal'

export type MatchResult = 'hit' | 'dup' | 'miss'

export interface GraphemeOutcome {
  grapheme: Grapheme
  spellingFound: boolean
  examplesFound: string[]
  grade: Grade
}

/**
 * One study session. The unit is a sound group: you type every spelling that
 * makes the sound, then its example words. Grades come from what you typed, and
 * a group with any grade below 4 comes back at the end of this session.
 */
export function useStudyQueue() {
  const { data, gradeCard } = useStore()
  const today = useMemo(() => todayISO(), [])

  const [queue, setQueue] = useState<string[]>(() => buildGroupQueue(data.phonemes, today))
  const [phase, setPhase] = useState<Phase>('spell')
  const [found, setFound] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const [examplesFound, setExamplesFound] = useState<Record<string, string[]>>({})
  const [reviewed, setReviewed] = useState(0)

  const group: Phoneme | null = data.phonemes.find((p) => p.id === queue[0]) ?? null

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
      setFound((f) => [...f, hit.id])
      return 'hit'
    },
    [group, found],
  )

  const submitExample = useCallback(
    (graphemeId: string, text: string): MatchResult => {
      const n = normalize(text)
      if (!group || !n) return 'miss'
      const g = group.graphemes.find((x) => x.id === graphemeId)
      const hit = g?.examples.find((ex) => normalize(ex) === n)
      if (!hit) return 'miss'
      const already = examplesFound[graphemeId] ?? []
      if (already.includes(hit)) return 'dup'
      setExamplesFound((m) => ({ ...m, [graphemeId]: [...(m[graphemeId] ?? []), hit] }))
      return 'hit'
    },
    [group, examplesFound],
  )

  /** Live per-grapheme result — also what `commit` writes to the store. */
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
    setPhase('spell')
    setFound([])
    setRejected([])
    setExamplesFound({})
  }, [])

  const check = useCallback(() => setPhase('reveal'), [])

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
    outcomes,
    rejected,
    foundCount: found.length,
    remaining: queue.length,
    reviewed,
    submitSpelling,
    submitExample,
    check,
    commit,
    restart,
    today,
  }
}
