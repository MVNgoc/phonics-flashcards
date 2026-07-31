import type { AppData, StoredState } from './types'
import { seedData } from './seed'

export const STORAGE_KEY = 'phonics-flashcard:v1'
export const THEME_KEY = 'phonics-flashcard:theme'
export const CURRENT_VERSION = 1

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** Bring older payloads up to CURRENT_VERSION. Only one version so far. */
function migrate(stored: StoredState): AppData {
  return stored.data
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return seedData()
    return migrate(parsed)
  } catch {
    return seedData()
  }
}

export function saveData(data: AppData): void {
  const payload: StoredState = { version: CURRENT_VERSION, data }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('Không lưu được vào localStorage', err)
  }
}

export function exportData(data: AppData): void {
  const payload: StoredState = { version: CURRENT_VERSION, data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phonics-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Accepts either a {version,data} backup or a bare AppData object. */
export function parseImported(text: string): AppData {
  const parsed = JSON.parse(text) as StoredState | AppData
  const data = 'data' in parsed ? (parsed as StoredState).data : (parsed as AppData)
  if (!data || !Array.isArray(data.phonemes)) throw new Error('File không đúng định dạng')
  return data
}
