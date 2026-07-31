import { useCallback, useEffect, useState } from 'react'
import { THEME_KEY } from '../lib/storage'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  // index.html already applied the class; read it back so we stay in sync.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}
