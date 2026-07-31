interface Props {
  percent: number
  learned: number
  total: number
}

export function ProgressBar({ percent, learned, total }: Props) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">Đã thuộc {percent}%</span>
        <span className="text-slate-500 dark:text-slate-400">
          {learned}/{total} trường hợp
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
