import { useMemo } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { TypingCard } from '../components/TypingCard'
import { useStore } from '../hooks/useStore'
import { useStudyQueue } from '../hooks/useStudyQueue'
import { computeStats } from '../lib/sm2'

export function StudyPage() {
  const { data } = useStore()
  const session = useStudyQueue()
  const stats = useMemo(
    () => computeStats(data.phonemes, session.today),
    [data.phonemes, session.today],
  )

  return (
    <div className="space-y-5">
      <ProgressBar percent={stats.percent} learned={stats.learned} total={stats.total} />

      <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Gõ ra tất cả cách viết của âm, rồi gõ từ ví dụ.</span>
        <span className="shrink-0">
          còn {session.remaining} · đã ôn {session.reviewed}
        </span>
      </div>

      {session.group ? (
        <>
          <TypingCard
            group={session.group}
            phase={session.phase}
            outcomes={session.outcomes}
            rejected={session.rejected}
            foundCount={session.foundCount}
            onSubmitSpelling={session.submitSpelling}
            onSubmitExample={session.submitExample}
            onCheck={session.check}
            onCommit={session.commit}
          />
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Enter = thêm câu trả lời · Enter khi ô trống = kiểm tra · gõ đúng cách viết + ít nhất 1
            ví dụ = Tốt, quên ví dụ = Khó, thiếu cách viết = Sai
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
            onClick={session.restart}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Học lại phiên mới
          </button>
        </div>
      )}
    </div>
  )
}
