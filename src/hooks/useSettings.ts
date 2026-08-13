import { useCallback, useEffect, useState } from 'react'
import { SETTINGS_KEY } from '../lib/storage'

export interface Settings {
  /** Hiện "· N trường hợp" trên thẻ. Tắt đi để luyện nâng cao, không dựa vào số. */
  showCaseCount: boolean
}

export const DEFAULT_SETTINGS: Settings = { showCaseCount: true }

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

  const toggle = useCallback((key: keyof Settings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }, [])

  return { settings, toggle }
}
