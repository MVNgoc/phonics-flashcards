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

export interface Phoneme {
  id: string
  ipa: string
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

export type StudyMode = 'spelling-to-sound' | 'sound-to-spelling'
