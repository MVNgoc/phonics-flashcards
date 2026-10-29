import { useCallback, useSyncExternalStore } from 'react'
import type { Direction } from '../lib/deck'
import { SETTINGS_KEY } from '../lib/storage'

export interface Settings {
  /** Hiện "· N trường hợp" trên thẻ. Tắt đi để luyện nâng cao, không dựa vào số. */
  showCaseCount: boolean
  /** Chiều học đang chọn ở trang Học, nhớ cho lần sau. */
  studyDirection: Direction
  /** voiceURI của giọng đọc ở trang Nghe; rỗng = tự chọn giọng en-GB tốt nhất. */
  dictationVoice: string
}

export const DEFAULT_SETTINGS: Settings = {
  showCaseCount: true,
  studyDirection: 'forward',
  dictationVoice: '',
}

type BooleanKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings]

function initialSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Một bản tuỳ chọn dùng chung cho mọi component: đổi chiều học ở trang Học thì
 * đầu trang cũng đổi theo ngay.
 */
let current: Settings = initialSettings()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setSettings(next: (s: Settings) => Settings) {
  current = next(current)
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current))
  } catch (err) {
    console.error('Không lưu được tuỳ chọn', err)
  }
  for (const l of listeners) l()
}

/** Tuỳ chọn luyện tập, giữ riêng ở localStorage — không nằm trong dữ liệu âm. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, () => current)

  const toggle = useCallback((key: BooleanKey) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return { settings, toggle, update }
}
