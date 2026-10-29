import { useMemo } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { useStore } from '../hooks/useStore'
import { computeStats, RECENT_DAYS, todayISO } from '../lib/sm2'
import { deckProgress, forwardDeck, reverseDeck, weakestItems, type WeakItem } from '../lib/deck'

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="cp-panel p-4">
      <div className="cp-neon text-4xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

function WeakList({ title, items }: { title: string; items: WeakItem[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em]">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có lần sai nào.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((w) => (
            <li key={`${w.group}-${w.spelling}`} className="flex items-center gap-3">
              <span
                className="w-36 shrink-0 truncate text-sm font-medium"
                title={w.group ? `${w.spelling} — ${w.group}` : w.spelling}
              >
                {w.spelling} <span className="text-slate-400">{w.group}</span>
              </span>
              <span className="h-5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                <span
                  className="block h-full rounded bg-rose-500"
                  style={{ width: `${(w.wrong / w.answered) * 100}%` }}
                />
              </span>
              <span
                className="w-12 text-right text-sm tabular-nums"
                title={`Sai ${w.wrong} trong ${w.answered} ngày ôn gần nhất`}
              >
                {w.wrong}/{w.answered}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StatsPage() {
  const { data } = useStore()
  const today = todayISO()
  const stats = useMemo(() => computeStats(data.phonemes, today), [data.phonemes, today])
  const forward = useMemo(() => deckProgress(forwardDeck(data.phonemes)), [data.phonemes])
  const reverse = useMemo(() => deckProgress(reverseDeck(data.phonemes)), [data.phonemes])
  const weakForward = useMemo(() => weakestItems(data.phonemes, 'forward'), [data.phonemes])
  const weakReverse = useMemo(() => weakestItems(data.phonemes, 'reverse'), [data.phonemes])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <ProgressBar
          percent={forward.percent}
          learned={forward.learned}
          remembering={forward.remembering}
          total={forward.total}
          label="Âm → Chữ: đã thuộc"
        />
        <ProgressBar
          percent={reverse.percent}
          learned={reverse.learned}
          remembering={reverse.remembering}
          total={reverse.total}
          label="Chữ → Âm: đã thuộc"
          unit="cặp chữ – âm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="cần ôn hôm nay" value={stats.dueToday} />
        <Tile label="tổng trường hợp" value={stats.total} />
        <Tile label="đã thuộc" value={stats.learned} />
        <Tile label="tiến độ" value={`${stats.percent}%`} />
      </div>

      <section>
        <h2 className="mb-3 border-b border-slate-900 pb-1 font-display text-xl font-semibold">Top 5 trường hợp sai nhiều nhất</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Tính trên {RECENT_DAYS} ngày ôn gần nhất của mỗi trường hợp, mỗi ngày chỉ lấy lần trả lời đầu tiên.
        </p>
        <div className="space-y-5">
          <WeakList title="Âm → Chữ" items={weakForward} />
          <WeakList title="Chữ → Âm" items={weakReverse} />
        </div>
      </section>
    </div>
  )
}
