interface Props {
  percent: number
  learned: number
  total: number
  /** Mặc định là tiến độ chiều xuôi; chiều ngược đặt nhãn và đơn vị riêng. */
  label?: string
  unit?: string
}

export function ProgressBar({ percent, learned, total, label = 'Đã thuộc', unit = 'trường hợp' }: Props) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold uppercase tracking-wider">
          {label} {percent}%
        </span>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {learned}/{total} {unit}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="cp-progress h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
