import type { AppData, StoredState } from './types'
import { seedData } from './seed'

/**
 * Đổi key = vứt hẳn dữ liệu cũ và nạp lại seed. Chỉ làm khi bộ âm thay đổi tận
 * gốc và tiến độ ôn cũ không còn ý nghĩa.
 */
export const STORAGE_KEY = 'phonics-flashcard:v2'
const LEGACY_KEYS = ['phonics-flashcard:v1']
export const THEME_KEY = 'phonics-flashcard:theme'
export const SETTINGS_KEY = 'phonics-flashcard:settings'
export const CURRENT_VERSION = 2

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** Bring older payloads up to CURRENT_VERSION. v1 had an `ipa` field; v2 drops it. */
export function migrate(stored: StoredState): AppData {
  if (stored.version >= 2) return stored.data
  return {
    ...stored.data,
    phonemes: stored.data.phonemes.map((p) => {
      const { ipa, ...rest } = p as typeof p & { ipa?: string }
      void ipa
      return rest
    }),
  }
}

export function loadData(): AppData {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
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
