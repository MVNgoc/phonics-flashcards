import { describe, it, expect } from 'vitest'
import { seedData } from './seed'
import { normalize } from './sm2'

const { phonemes } = seedData()

describe('seed data', () => {
  it('có đủ nguyên âm và phụ âm', () => {
    expect(phonemes.filter((p) => p.type === 'vowel')).toHaveLength(21)
    expect(phonemes.filter((p) => p.type === 'consonant')).toHaveLength(11)
  })

  it('mọi âm đều có nhãn — nhãn là đề bài khi học', () => {
    for (const p of phonemes) expect(p.note?.trim()).toBeTruthy()
  })

  it('nhãn âm không trùng nhau', () => {
    const labels = phonemes.map((p) => normalize(p.note ?? ''))
    expect(new Set(labels).size).toBe(labels.length)
  })

  /**
   * Trùng tên trường hợp trong cùng một âm là bug: lúc học chỉ cái đầu tiên khớp
   * được, cái sau không bao giờ gõ tới nên luôn bị chấm Sai.
   */
  it('trong một âm, không có hai trường hợp trùng tên', () => {
    for (const p of phonemes) {
      const spellings = p.graphemes.map((g) => normalize(g.spelling))
      expect(new Set(spellings).size, `trùng trường hợp trong ${p.note}`).toBe(spellings.length)
    }
  })

  it('một trường hợp không có ví dụ lặp lại', () => {
    for (const p of phonemes) {
      for (const g of p.graphemes) {
        const examples = g.examples.map(normalize)
        expect(new Set(examples).size, `ví dụ lặp ở ${p.note} / ${g.spelling}`).toBe(examples.length)
      }
    }
  })

  it('mọi âm có ít nhất một trường hợp, mọi trường hợp có tên', () => {
    for (const p of phonemes) {
      expect(p.graphemes.length, `${p.note} rỗng`).toBeGreaterThan(0)
      for (const g of p.graphemes) expect(g.spelling.trim()).toBeTruthy()
    }
  })

  it('id không trùng nhau', () => {
    const ids = phonemes.flatMap((p) => [p.id, ...p.graphemes.map((g) => g.id)])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tiến độ ôn bắt đầu từ trạng thái mới', () => {
    for (const p of phonemes) {
      for (const g of p.graphemes) {
        expect(g.review.nextDue).toBeNull()
        expect(g.review.repetitions).toBe(0)
      }
    }
  })
})
