import { useMemo } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { TypingCard } from '../components/TypingCard'
import { useSettings } from '../hooks/useSettings'
import { useStore } from '../hooks/useStore'
import { useStudyQueue } from '../hooks/useStudyQueue'
import { buildDeck, deckProgress, DIRECTION_LABEL, ITEM_UNIT, type Direction } from '../lib/deck'

const DIRECTIONS: { value: Direction; label: string }[] = (['forward', 'reverse'] as const).map((value) => ({
  value,
  label: DIRECTION_LABEL[value],
}))

/** Câu chữ khác nhau giữa hai chiều học. */
const COPY: Record<
  Direction,
  { unit: string; intro: string; help: string; progressLabel?: string; progressUnit?: string }
> = {
  forward: {
    unit: 'trường hợp',
    intro: 'Gõ từng trường hợp tạo nên âm, đúng thì gõ một ví dụ cho nó.',
    help: 'Enter = trả lời · Enter khi ô trống = bỏ qua bước đang làm · bấm “+ ví dụ” để gõ bù ví dụ đã bỏ qua · đúng trường hợp + 1 ví dụ = Tốt, không nhớ ví dụ = Khó, thiếu trường hợp = Sai',
  },
  reverse: {
    unit: 'âm',
    intro: 'Gõ từng âm mà cách viết này tạo ra, đúng thì gõ một ví dụ cho nó.',
    help: 'Gõ âm không cần dấu “/” (ai = /ai/, short oo = Short /oo/) · Enter khi ô trống = bỏ qua bước đang làm · bấm “+ ví dụ” để gõ bù · đúng âm + 1 ví dụ = Tốt, không nhớ ví dụ = Khó, thiếu âm = Sai',
    progressLabel: 'Chữ → Âm: đã thuộc',
    progressUnit: 'cặp chữ – âm',
  },
}

/** Icon con mắt nét mảnh, theo màu chữ; nhắm thì có gạch chéo. */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M3 3l18 18" />}
    </svg>
  )
}

export function StudyPage() {
  const { settings, toggle, update } = useSettings()
  const direction = settings.studyDirection

  return (
    // Màn hình lớn: đẩy cả khối xuống một khoảng cố định để thẻ nằm ở khoảng 1/3
    // trên màn hình. Không căn giữa dọc vì thẻ cao lên khi xem đáp án, căn giữa
    // thì ô gõ / nút Chấm nhảy chỗ. Điện thoại giữ sát trên vì bàn phím ảo.
    <div className="space-y-5 md:pt-[9vh]">
      <div className="flex rounded-lg border border-slate-600 p-0.5 text-sm font-semibold">
        {DIRECTIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => update({ studyDirection: d.value })}
            aria-pressed={direction === d.value}
            className={`flex-1 rounded-md px-3 py-1.5 uppercase tracking-wider ${
              direction === d.value
                ? 'cp-btn'
                : 'text-slate-500 hover:text-sky-600 dark:text-slate-400'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* key: đổi chiều thì bắt đầu một phiên mới, không trộn hai bộ thẻ. */}
      <StudySession
        key={direction}
        direction={direction}
        showCaseCount={settings.showCaseCount}
        onToggleCaseCount={() => toggle('showCaseCount')}
      />
    </div>
  )
}

function StudySession({
  direction,
  showCaseCount,
  onToggleCaseCount,
}: {
  direction: Direction
  showCaseCount: boolean
  onToggleCaseCount: () => void
}) {
  const { data } = useStore()
  const session = useStudyQueue(direction)
  const copy = COPY[direction]
  const stats = useMemo(() => deckProgress(buildDeck(data.phonemes, direction)), [data.phonemes, direction])

  return (
    <>
      <ProgressBar
        percent={stats.percent}
        learned={stats.learned}
        remembering={stats.remembering}
        total={stats.total}
        label={copy.progressLabel}
        unit={copy.progressUnit}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>{copy.intro}</span>
        <span className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleCaseCount}
            aria-pressed={showCaseCount}
            title={`Ẩn số ${copy.unit} để luyện nâng cao`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 font-medium hover:border-sky-500 hover:text-sky-600 dark:border-slate-600"
          >
            <EyeIcon open={showCaseCount} />
            {showCaseCount ? `hiện số ${copy.unit}` : `ẩn số ${copy.unit}`}
          </button>
          <span title="Thẻ chưa đạt Tốt hết sẽ được hỏi lại ở cuối hàng, nên mỗi lần chấm lại vẫn tính thêm một lượt">
            còn {session.remaining} thẻ ({session.remainingItems} {ITEM_UNIT[direction]}) · đã chấm{' '}
            {session.reviewed} lượt
          </span>
        </span>
      </div>

      {session.group ? (
        <>
          <TypingCard
            direction={direction}
            group={session.group}
            phase={session.phase}
            pending={session.pending}
            outcomes={session.outcomes}
            rejected={session.rejected}
            foundCount={session.foundCount}
            allFound={session.allFound}
            showCaseCount={showCaseCount}
            onSubmitAnswer={session.submitAnswer}
            onSubmitExample={session.submitExample}
            onSkipExamples={session.skipExamples}
            onRevisitExamples={session.revisitExamples}
            onFinish={session.finish}
            onCommit={session.commit}
          />
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">{copy.help}</p>
        </>
      ) : (
        <div className="cp-panel p-10 text-center">
          <p className="text-lg font-medium">Hết thẻ cần ôn hôm nay 🎉</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {stats.total === 0
              ? 'Chưa có dữ liệu — sang trang Quản lý để thêm âm.'
              : 'Quay lại mai để giữ nhịp ôn. Muốn gõ thêm hôm nay thì luyện tự do, nhưng ôn lại trong ngày không cộng thêm tiến độ.'}
          </p>
          <button
            type="button"
            onClick={session.restart}
            className="cp-btn mt-4 rounded-lg px-4 py-2 text-sm"
          >
            Luyện tự do (không tính tiến độ)
          </button>
        </div>
      )}
    </>
  )
}
