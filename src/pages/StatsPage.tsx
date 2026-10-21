import { useMemo } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { useStore } from '../hooks/useStore'
import { computeStats, todayISO } from '../lib/sm2'
import { deckProgress, reverseDeck } from '../lib/deck'

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="cp-panel p-4">
      <div className="cp-neon font-mono text-3xl font-bold">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

export function StatsPage() {
  const { data } = useStore()
  const today = todayISO()
  const stats = useMemo(() => computeStats(data.phonemes, today), [data.phonemes, today])
  const reverse = useMemo(() => deckProgress(reverseDeck(data.phonemes)), [data.phonemes])
  const maxWrong = stats.worst[0]?.wrongCount ?? 1

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <ProgressBar
          percent={stats.percent}
          learned={stats.learned}
          total={stats.total}
          label="Âm → Chữ: đã thuộc"
        />
        <ProgressBar
          percent={reverse.percent}
          learned={reverse.learned}
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
        <h2 className="mb-3 font-semibold">Top 5 trường hợp sai nhiều nhất</h2>
        {stats.worst.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có lần sai nào.</p>
        ) : (
          <ul className="space-y-2">
            {stats.worst.map((w) => (
              <li key={`${w.group}-${w.spelling}`} className="flex items-center gap-3">
                <span
                  className="w-36 shrink-0 truncate text-sm font-medium"
                  title={w.group ? `${w.spelling} — ${w.group}` : w.spelling}
                >
                  {w.spelling} <span className="text-slate-400">{w.group}</span>
                </span>
                <span className="h-5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                  <span
                    className="block h-full rounded bg-rose-500 shadow-[0_0_10px_rgb(255_42_109/0.6)]"
                    style={{ width: `${(w.wrongCount / maxWrong) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right text-sm tabular-nums">{w.wrongCount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
