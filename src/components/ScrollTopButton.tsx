import { useEffect, useState } from 'react'

/** Nút nổi góc dưới phải, chỉ hiện khi đã cuộn quá một màn hình; bấm để về đầu trang. */
export function ScrollTopButton() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!shown) return null

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
      }}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      className="fixed bottom-5 right-5 z-20 flex flex-col items-center border border-slate-900 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-900 transition-colors hover:bg-slate-900 hover:text-slate-50"
    >
      <span className="text-base leading-none">↑</span>
      Đầu
    </button>
  )
}
