import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Grapheme, Phoneme, PhonemeType } from '../lib/types'
import { loadData, saveData, uid } from '../lib/storage'
import { newReviewState, review, type Grade } from '../lib/sm2'
import { seedData } from '../lib/seed'

export interface ParsedPhoneme {
  note: string
  type: PhonemeType
  graphemes: { spelling: string; examples: string[] }[]
}

interface Store {
  data: AppData
  addPhoneme: (type: PhonemeType, note?: string) => void
  updatePhoneme: (id: string, patch: Partial<Pick<Phoneme, 'type' | 'note'>>) => void
  deletePhoneme: (id: string) => void
  addGrapheme: (phonemeId: string, spelling: string, examples?: string[]) => void
  updateGrapheme: (
    phonemeId: string,
    graphemeId: string,
    patch: Partial<Pick<Grapheme, 'spelling' | 'examples'>>,
  ) => void
  deleteGrapheme: (phonemeId: string, graphemeId: string) => void
  gradeCard: (phonemeId: string, graphemeId: string, grade: Grade, today: string) => void
  mergeParsed: (parsed: ParsedPhoneme[]) => void
  replaceAll: (data: AppData) => void
  resetToSeed: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const mapPhoneme = useCallback((id: string, fn: (p: Phoneme) => Phoneme) => {
    setData((d) => ({ ...d, phonemes: d.phonemes.map((p) => (p.id === id ? fn(p) : p)) }))
  }, [])

  const addPhoneme = useCallback((type: PhonemeType, note?: string) => {
    setData((d) => ({
      ...d,
      phonemes: [...d.phonemes, { id: uid(), type, note, graphemes: [] }],
    }))
  }, [])

  const updatePhoneme = useCallback<Store['updatePhoneme']>(
    (id, patch) => mapPhoneme(id, (p) => ({ ...p, ...patch })),
    [mapPhoneme],
  )

  const deletePhoneme = useCallback((id: string) => {
    setData((d) => ({ ...d, phonemes: d.phonemes.filter((p) => p.id !== id) }))
  }, [])

  const addGrapheme = useCallback<Store['addGrapheme']>(
    (phonemeId, spelling, examples = []) =>
      mapPhoneme(phonemeId, (p) => ({
        ...p,
        graphemes: [...p.graphemes, { id: uid(), spelling, examples, review: newReviewState() }],
      })),
    [mapPhoneme],
  )

  const updateGrapheme = useCallback<Store['updateGrapheme']>(
    (phonemeId, graphemeId, patch) =>
      mapPhoneme(phonemeId, (p) => ({
        ...p,
        graphemes: p.graphemes.map((g) => (g.id === graphemeId ? { ...g, ...patch } : g)),
      })),
    [mapPhoneme],
  )

  const deleteGrapheme = useCallback<Store['deleteGrapheme']>(
    (phonemeId, graphemeId) =>
      mapPhoneme(phonemeId, (p) => ({
        ...p,
        graphemes: p.graphemes.filter((g) => g.id !== graphemeId),
      })),
    [mapPhoneme],
  )

  const gradeCard = useCallback<Store['gradeCard']>(
    (phonemeId, graphemeId, grade, today) =>
      mapPhoneme(phonemeId, (p) => ({
        ...p,
        graphemes: p.graphemes.map((g) =>
          g.id === graphemeId ? { ...g, review: review(g.review, grade, today) } : g,
        ),
      })),
    [mapPhoneme],
  )

  /**
   * Bulk import: merge groups by note (blank note always creates a new group),
   * merge graphemes by spelling, union the examples.
   */
  const mergeParsed = useCallback((parsed: ParsedPhoneme[]) => {
    setData((d) => {
      const phonemes = [...d.phonemes]
      for (const inc of parsed) {
        const key = inc.note.trim().toLowerCase()
        const idx = key === '' ? -1 : phonemes.findIndex((p) => (p.note ?? '').trim().toLowerCase() === key)
        if (idx === -1) {
          phonemes.push({
            id: uid(),
            note: inc.note.trim() || undefined,
            type: inc.type,
            graphemes: inc.graphemes.map((g) => ({
              id: uid(),
              spelling: g.spelling,
              examples: g.examples,
              review: newReviewState(),
            })),
          })
          continue
        }
        const target = phonemes[idx]
        const graphemes = [...target.graphemes]
        for (const g of inc.graphemes) {
          const gi = graphemes.findIndex((x) => x.spelling === g.spelling)
          if (gi === -1) {
            graphemes.push({
              id: uid(),
              spelling: g.spelling,
              examples: g.examples,
              review: newReviewState(),
            })
          } else {
            graphemes[gi] = {
              ...graphemes[gi],
              examples: [...new Set([...graphemes[gi].examples, ...g.examples])],
            }
          }
        }
        phonemes[idx] = { ...target, type: inc.type, graphemes }
      }
      return { ...d, phonemes }
    })
  }, [])

  const replaceAll = useCallback((next: AppData) => setData(next), [])
  const resetToSeed = useCallback(() => setData(seedData()), [])

  const value: Store = {
    data,
    addPhoneme,
    updatePhoneme,
    deletePhoneme,
    addGrapheme,
    updateGrapheme,
    deleteGrapheme,
    gradeCard,
    mergeParsed,
    replaceAll,
    resetToSeed,
  }

  return createElement(StoreContext.Provider, { value }, children)
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore phải nằm trong <StoreProvider>')
  return ctx
}
