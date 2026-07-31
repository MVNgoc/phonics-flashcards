import { useEffect, useMemo } from 'react'
import { Flashcard } from '../components/Flashcard'
import { ProgressBar } from '../components/ProgressBar'
import { useStore } from '../hooks/useStore'
import { useStudyQueue } from '../hooks/useStudyQueue'
import { computeStats, GRADES, type Grade } from '../lib/sm2'

export function StudyPage() {
  const { data } = useStore()
  const { card, remaining, reviewed, flipped, flip, answer, restart, today } = useStudyQueue()
  const stats = useMemo(() => computeStats(data.phonemes, today), [data.phonemes, today])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        flip()
        return
      }
      const hit = GRADES.find((g) => g.key === e.key)
      if (hit && flipped) answer(hit.grade as Grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flip, answer, flipped])

  return (
    <div className="space-y-5">
      <ProgressBar percent={stats.percent} learned={stats.learned} total={stats.total} />

      <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Xem cách viết, tự đọc thành tiếng, rồi lật thẻ để kiểm tra.</span>
        <span className="shrink-0">
          còn {remaining} · đã ôn {reviewed}
        </span>
      </div>

      {card ? (
        <>
          <Flashcard
            phoneme={card.phoneme}
            grapheme={card.grapheme}
            flipped={flipped}
            onFlip={flip}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                disabled={!flipped}
                onClick={() => answer(g.grade)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-30 ${g.color}`}
              >
                {g.label} <span className="opacity-70">({g.key})</span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Space = lật thẻ · 1/2/3/4 = Sai/Khó/Tốt/Dễ
            {!flipped && ' · lật thẻ trước khi đánh giá'}
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <p className="text-lg font-medium">Hết thẻ cần ôn hôm nay 🎉</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {stats.total === 0
              ? 'Chưa có dữ liệu — sang trang Quản lý để thêm âm.'
              : 'Quay lại mai, hoặc bắt đầu lại phiên học.'}
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Học lại phiên mới
          </button>
        </div>
      )}
    </div>
  )
}
