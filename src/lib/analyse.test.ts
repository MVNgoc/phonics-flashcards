import { describe, expect, it } from 'vitest'
import { analyse, dictionaryInfo, shadeOf, splitSyllables, stressOptions } from './analyse'

const splits = (w: string) => splitSyllables(w).map((c) => c.syllables.map((s) => s.text).join('.'))

describe('splitSyllables', () => {
  it('ưu tiên từ gốc và tách hậu tố', () => {
    expect(splits('teacher')).toEqual(['teach.er'])
    expect(splits('speaker')).toEqual(['speak.er'])
    expect(splits('naturally')[0]).toBe('na.tur.al.ly')
    expect(splits('naturally')).toContain('nat.ur.al.ly')
  })
  it('ưu tiên double consonant', () => {
    expect(splits('letter')).toEqual(['let.ter'])
    expect(splits('running')).toEqual(['run.ning'])
  })
  it('cụm phụ âm: chia ở giữa, digraph không bị tách', () => {
    expect(splits('basket')).toEqual(['bas.ket'])
    expect(splits('father')).toEqual(['fath.er'])
  })
  it('e câm cuối từ không tính là âm tiết', () => {
    expect(splits('make')).toEqual(['make'])
    expect(splits('table')[0]).toBe('ta.ble')
  })
  it('hậu tố nhiều âm tiết', () => {
    expect(splits('biology')[0]).toBe('bi.o.lo.gy')
  })
})

describe('shadeOf', () => {
  it('áp dụng 15 quy tắc', () => {
    expect(shadeOf('go', 1, true)).toMatchObject({ sound: 'oa', rule: 1 })
    expect(shadeOf('cat', 1, true)).toMatchObject({ sound: 'a', rule: 2 })
    expect(shadeOf('teach', 1, true)).toMatchObject({ sound: 'ee', rule: 3 })
    expect(shadeOf('night', 1, true)).toMatchObject({ sound: 'igh', rule: 12 })
    expect(shadeOf('bird', 1, true)).toMatchObject({ sound: 'ur', rule: 15 })
    expect(shadeOf('ty', 2, true)).toMatchObject({ sound: 'i', rule: 13 })
  })
})

describe('stress', () => {
  it('từ 4 âm tiết: 20/40/40, không nhấn âm cuối', () => {
    const syls = splitSyllables('banana'.padEnd(6) + 'ly')[0].syllables
    expect(syls.length).toBe(4)
    expect(stressOptions(syls).map((o) => [o.index, o.chance])).toEqual([[0, 20], [1, 40], [2, 40]])
  })
  it('nhấn âm 3 → âm 1 giữ nguyên, âm 2 và 4 rớt', () => {
    const syls = splitSyllables('na.tu.ral.ly'.replace(/\./g, ''))[0].syllables
    const r = analyse(syls, 2, { verb: false, reduce: {} })
    expect(r.map((x) => x.state)).toEqual(['kept', 'reduced', 'stressed', 'reduced'])
  })
  it('-tion luôn là /shun/, nhấn âm trước nó; -que luôn nhấn', () => {
    const syls = splitSyllables('station')[0].syllables
    expect(stressOptions(syls)).toMatchObject([{ index: syls.length - 2 }])
    expect(analyse(syls, 0, { verb: false, reduce: {} }).slice(-1)[0]).toMatchObject({ sound: 'shun', state: 'fixed' })
    const u = splitSyllables('unique')[0].syllables
    expect(stressOptions(u)[0].index).toBe(u.length - 1)
  })
  it('ace/age/ate: danh từ /i/, động từ /ai/', () => {
    const syls = splitSyllables('village')[0].syllables
    expect(analyse(syls, 0, { verb: false, reduce: {} }).slice(-1)[0]?.sound).toBe('i')
    expect(analyse(syls, 0, { verb: true, reduce: {} }).slice(-1)[0]?.sound).toBe('ai')
  })
})

describe('dictionaryInfo', () => {
  it('đếm âm tiết và vị trí nhấn', () => {
    expect(dictionaryInfo('n ˈæ tʃ ɹ ə l i')).toMatchObject({ syllables: 3, stress: 0 })
    expect(dictionaryInfo('j uː n ˈiː k')).toMatchObject({ syllables: 2, stress: 1 })
    expect(dictionaryInfo(undefined)).toBeNull()
  })
})
