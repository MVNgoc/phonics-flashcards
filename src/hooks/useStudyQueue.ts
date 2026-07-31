import { useCallback, useMemo, useState } from 'react'
import { buildQueue, todayISO, type Grade, type QueueCard } from '../lib/sm2'
import type { Grapheme, Phoneme } from '../lib/types'
import { useStore } from './useStore'

export interface ActiveCard extends QueueCard {
  phoneme: Phoneme
  grapheme: Grapheme
}

/**
 * One study session. The queue is snapshotted when the session starts so
 * rescheduling a card mid-session doesn't reshuffle what's left; a wrong answer
 * pushes the card to the back of this session's queue.
 */
export function useStudyQueue() {
  const { data, gradeCard } = useStore()
  const today = useMemo(() => todayISO(), [])

  const [queue, setQueue] = useState<QueueCard[]>(() => buildQueue(data.phonemes, today))
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const lookup = useCallback(
    (c: QueueCard | undefined): ActiveCard | null => {
      if (!c) return null
      const phoneme = data.phonemes.find((p) => p.id === c.phonemeId)
      const grapheme = phoneme?.graphemes.find((g) => g.id === c.graphemeId)
      if (!phoneme || !grapheme) return null
      return { ...c, phoneme, grapheme }
    },
    [data.phonemes],
  )

  const card = lookup(queue[0])

  const answer = useCallback(
    (grade: Grade) => {
      const current = queue[0]
      if (!current) return
      gradeCard(current.phonemeId, current.graphemeId, grade, today)
      setReviewed((n) => n + 1)
      setFlipped(false)
      // Wrong answers come back at the end of this session.
      setQueue((q) => (grade < 3 ? [...q.slice(1), current] : q.slice(1)))
    },
    [queue, gradeCard, today],
  )

  const restart = useCallback(() => {
    setQueue(buildQueue(data.phonemes, today))
    setReviewed(0)
    setFlipped(false)
  }, [data.phonemes, today])

  return {
    card,
    remaining: queue.length,
    reviewed,
    flipped,
    flip: () => setFlipped((f) => !f),
    answer,
    restart,
    today,
  }
}
