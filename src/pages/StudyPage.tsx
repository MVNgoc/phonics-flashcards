import { useMemo } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { TypingCard } from '../components/TypingCard'
import { useSettings } from '../hooks/useSettings'
import { useStore } from '../hooks/useStore'
import { useStudyQueue } from '../hooks/useStudyQueue'
import { computeStats } from '../lib/sm2'

export function StudyPage() {
  const { data } = useStore()
  const session = useStudyQueue()
  const { settings, toggle } = useSettings()
  const stats = useMemo(
    () => computeStats(data.phonemes, session.today),
    [data.phonemes, session.today],
  )

  return (
    <div className="space-y-5">
      <ProgressBar percent={stats.percent} learned={stats.learned} total={stats.total} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Gõ từng trường hợp tạo nên âm, đúng thì gõ một ví dụ cho nó.</span>
        <span className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => toggle('showCaseCount')}
            aria-pressed={settings.showCaseCount}
            title="Ẩn số trường hợp để luyện nâng cao"
            className="rounded-lg border border-slate-300 px-2.5 py-1 font-medium hover:border-sky-500 hover:text-sky-600 dark:border-slate-600"
          >
            {settings.showCaseCount ? '👁 hiện số trường hợp' : '🙈 ẩn số trường hợp'}
          </button>
          <span>
            còn {session.remaining} · đã ôn {session.reviewed}
          </span>
        </span>
      </div>

      {session.group ? (
        <>
          <TypingCard
            group={session.group}
            phase={session.phase}
            pending={session.pending}
            outcomes={session.outcomes}
            rejected={session.rejected}
            foundCount={session.foundCount}
            allFound={session.allFound}
            showCaseCount={settings.showCaseCount}
            onSubmitSpelling={session.submitSpelling}
            onSubmitExample={session.submitExample}
            onSkipExamples={session.skipExamples}
            onRevisitExamples={session.revisitExamples}
            onFinish={session.finish}
            onCommit={session.commit}
          />
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Enter = trả lời · Enter khi ô trống = bỏ qua bước đang làm · bấm “+ ví dụ” để gõ bù ví dụ
            đã bỏ qua · đúng trường hợp + 1 ví dụ = Tốt, không nhớ ví dụ = Khó, thiếu trường hợp =
            Sai
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <p className="text-lg font-medium">Hết thẻ cần ôn hôm nay 🎉</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {stats.total === 0
              ? 'Chưa có dữ liệu — sang trang Quản lý để thêm âm.'
              : 'Quay lại mai để giữ nhịp ôn. Muốn gõ thêm hôm nay thì luyện tự do, nhưng ôn lại trong ngày không cộng thêm tiến độ.'}
          </p>
          <button
            type="button"
            onClick={session.restart}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Luyện tự do (không tính tiến độ)
          </button>
        </div>
      )}
    </div>
  )
}
