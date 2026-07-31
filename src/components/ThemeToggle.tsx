import { useDarkMode } from '../hooks/useDarkMode'

export function ThemeToggle() {
  const { theme, toggle } = useDarkMode()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className="rounded-lg border border-slate-300 p-2 text-lg leading-none hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
