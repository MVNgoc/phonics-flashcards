import { useCallback, useEffect, useState } from 'react'
import type { Direction } from '../lib/deck'
import { SETTINGS_KEY } from '../lib/storage'

export interface Settings {
  /** Hiện "· N trường hợp" trên thẻ. Tắt đi để luyện nâng cao, không dựa vào số. */
  showCaseCount: boolean
  /** Chiều học đang chọn ở trang Học, nhớ cho lần sau. */
  studyDirection: Direction
}

export const DEFAULT_SETTINGS: Settings = { showCaseCount: true, studyDirection: 'forward' }

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

/** Tuỳ chọn luyện tập, giữ riêng ở localStorage — không nằm trong dữ liệu âm. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(initialSettings)

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (err) {
      console.error('Không lưu được tuỳ chọn', err)
    }
  }, [settings])

  const toggle = useCallback((key: BooleanKey) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return { settings, toggle, update }
}
