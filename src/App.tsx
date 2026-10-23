import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './hooks/useStore'
import { StudyPage } from './pages/StudyPage'
import { LookupPage } from './pages/LookupPage'
import { DictationPage } from './pages/DictationPage'
import { ManagePage } from './pages/ManagePage'
import { StatsPage } from './pages/StatsPage'

const NAV = [
  { to: '/study', label: 'Học' },
  { to: '/dictation', label: 'Nghe' },
  { to: '/lookup', label: 'Tra cứu' },
  { to: '/manage', label: 'Quản lý' },
  { to: '/stats', label: 'Thống kê' },
]

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen">
        <header className="border-b border-sky-500/30 bg-slate-950/60 shadow-[0_1px_16px_rgb(0_240_255/0.15)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 p-4 sm:gap-4">
            <span className="cp-neon hidden font-bold uppercase tracking-[0.2em] sm:inline">
              Phonics<span className="text-rose-500">//</span>
              <span className="cp-cursor text-sky-500">▮</span>
            </span>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap border-b-2 px-2.5 py-1.5 text-sm font-semibold uppercase tracking-wider transition sm:px-3 ${
                      isActive
                        ? 'cp-neon border-sky-500 bg-sky-500/10'
                        : 'border-transparent text-slate-400 hover:border-rose-500/60 hover:text-rose-400'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-3xl p-4 pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/study" replace />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/dictation" element={<DictationPage />} />
            <Route path="/lookup" element={<LookupPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/study" replace />} />
          </Routes>
        </main>
      </div>
    </StoreProvider>
  )
}
