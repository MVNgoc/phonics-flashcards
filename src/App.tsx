import { Fragment } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './hooks/useStore'
import { useSettings } from './hooks/useSettings'
import { useItemsLeftToday } from './hooks/useStudyQueue'
import { DIRECTION_LABEL, ITEM_UNIT } from './lib/deck'
import { StudyPage } from './pages/StudyPage'
import { LookupPage } from './pages/LookupPage'
import { DictationPage } from './pages/DictationPage'
import { ManagePage } from './pages/ManagePage'
import { StatsPage } from './pages/StatsPage'

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

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
        <Masthead />

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

/**
 * Đầu trang kiểu tờ báo: dòng ngày + số cần ôn của chiều đang học (khớp hàng đợi
 * trang Học), tên app ở giữa, menu kẹp giữa hai đường kẻ đôi.
 */
function Masthead() {
  const direction = useSettings().settings.studyDirection
  const itemsLeft = useItemsLeftToday(direction)

  return (
    <header className="mx-auto max-w-3xl px-4 pt-5">
      <div className="flex flex-wrap justify-between gap-x-4 border-b border-slate-900 pb-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500">
        <span>{DATE_FORMAT.format(new Date())}</span>
        <span>
          Cần ôn hôm nay ({DIRECTION_LABEL[direction]}): {itemsLeft} {ITEM_UNIT[direction]}
        </span>
      </div>
      <div className="py-3 text-center font-display text-4xl font-black tracking-tight sm:py-4 sm:text-5xl">
        The Phonics Review
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-x-1 border-y-4 border-double border-slate-900 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] sm:gap-x-2 sm:text-sm">
        {NAV.map((n, i) => (
          <Fragment key={n.to}>
            {i > 0 && <span className="text-slate-300">·</span>}
            <NavLink
              to={n.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-1.5 py-1 underline-offset-[6px] transition-colors sm:px-2 ${
                  isActive
                    ? 'text-rose-500 underline decoration-2'
                    : 'text-slate-600 hover:text-rose-500'
                }`
              }
            >
              {n.label}
            </NavLink>
          </Fragment>
        ))}
      </nav>
    </header>
  )
}
