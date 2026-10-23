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
  /** Tiến độ chiều ngược (cho cách viết, gõ âm). Chưa học chiều này thì không có. */
  reverseReview?: ReviewState
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
  /**
   * Trang Nghe: phân tích âm người dùng tự thêm làm đáp án được chấp nhận, ngoài
   * đáp án máy suy ra từ bảng. Khoá là từ (viết thường), giá trị là các phân tích
   * dạng nhãn chuẩn hoá cách nhau bằng dấu cách, vd "d or t ur".
   */
  extraAnswers?: Record<string, string[]>
}

/** What actually sits in localStorage — wrapper lets storage.ts migrate later. */
export interface StoredState {
  version: number
  data: AppData
}
