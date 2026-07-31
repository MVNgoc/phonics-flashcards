import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeToggle } from './components/ThemeToggle'
import { StoreProvider } from './hooks/useStore'
import { StudyPage } from './pages/StudyPage'
import { ManagePage } from './pages/ManagePage'
import { StatsPage } from './pages/StatsPage'

const NAV = [
  { to: '/study', label: 'Học' },
  { to: '/manage', label: 'Quản lý' },
  { to: '/stats', label: 'Thống kê' },
]

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <header className="border-b border-slate-200 dark:border-slate-700">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
            <span className="font-bold">Phonics</span>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-3xl p-4 pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/study" replace />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/study" replace />} />
          </Routes>
        </main>
      </div>
    </StoreProvider>
  )
}
