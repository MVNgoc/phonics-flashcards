export type PhonemeType = 'vowel' | 'consonant'

/** SM-2 state for one grapheme. Dates are ISO date strings: "YYYY-MM-DD". */
export interface ReviewState {
  lastReviewed: string | null
  interval: number
  easeFactor: number
  repetitions: number
  nextDue: string | null
  correctCount: number
  wrongCount: number
}

export interface Grapheme {
  id: string
  spelling: string
  examples: string[]
  review: ReviewState
}

/**
 * A group of spellings that share one sound. There is no IPA field — the group
 * is labelled by `note` (free text, optional) and identified by it on import.
 */
export interface Phoneme {
  id: string
  type: PhonemeType
  note?: string
  graphemes: Grapheme[]
}

export interface AppData {
  phonemes: Phoneme[]
}

/** What actually sits in localStorage — wrapper lets storage.ts migrate later. */
export interface StoredState {
  version: number
  data: AppData
}
