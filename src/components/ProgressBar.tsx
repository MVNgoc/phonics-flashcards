import { useId, useState } from 'react'

interface Props {
  percent: number
  learned: number
  /** Đang nhớ nhưng chưa thuộc: vẽ thành đoạn nhạt nối sau đoạn đã thuộc. */
  remembering: number
  total: number
  /** Mặc định là tiến độ chiều xuôi; chiều ngược đặt nhãn và đơn vị riêng. */
  label?: string
  unit?: string
}

/** Màu của hai đoạn trên thanh, dùng chung cho thanh và chú thích trong tooltip. */
const LEARNED_COLOR = 'cp-progress'
const REMEMBERING_COLOR = 'bg-slate-400 dark:bg-slate-500'

/**
 * Nút "?" giải thích hai mức. Hiện khi rê chuột, hoặc khi bấm (điện thoại không
 * có hover, Safari iOS cũng không focus nút khi chạm nên phải giữ state).
 */
function LevelsHelp() {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="group relative inline-flex normal-case tracking-normal">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-describedby={id}
        aria-label="Giải thích “đã thuộc” và “đang nhớ”"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[10px] font-semibold leading-none text-slate-500 hover:border-sky-500 hover:text-sky-600 dark:text-slate-400"
      >
        ?
      </button>
      <span
        id={id}
        role="tooltip"
        className={`cp-panel absolute left-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] space-y-2 p-3 text-xs font-normal text-slate-600 shadow-lg dark:text-slate-300 ${
          open ? 'block' : 'hidden group-hover:block'
        }`}
      >
        <span className="flex gap-2">
          <span className={`mt-1 h-2 w-3 shrink-0 rounded-full ${LEARNED_COLOR}`} />
          <span>
            <b>Đã thuộc</b>: trả lời đúng 3 lần liền, mỗi lần vào một ngày khác nhau. Lần ôn thứ 3 sớm
            nhất là 3 ngày sau lần thứ 2, nên nhanh nhất mất khoảng 5 ngày. Chỉ mức này được tính vào %.
          </span>
        </span>
        <span className="flex gap-2">
          <span className={`mt-1 h-2 w-3 shrink-0 rounded-full ${REMEMBERING_COLOR}`} />
          <span>
            <b>Đang nhớ</b>: lần trả lời gần nhất là đúng, nhưng chưa đủ 3 ngày để thành “đã thuộc”.
          </span>
        </span>
        <span className="block text-slate-500 dark:text-slate-400">
          Trong cùng một ngày, trả lời đúng bao nhiêu lần cũng chỉ tính là 1 lần. Trả lời sai một lần
          là đếm lại từ đầu, kể cả khi đã thuộc.
        </span>
      </span>
    </span>
  )
}

export function ProgressBar({
  percent,
  learned,
  remembering,
  total,
  label = 'Đã thuộc',
  unit = 'trường hợp',
}: Props) {
  // Độ rộng tính từ số đếm, không từ `percent` đã làm tròn, để hai đoạn khớp nhau.
  const width = (n: number) => (total === 0 ? 0 : (n / total) * 100)

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider">
          {label} {percent}%
          <LevelsHelp />
        </span>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {learned}/{total} {unit} · đang nhớ {remembering}
        </span>
      </div>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`đã thuộc ${learned}/${total}, đang nhớ ${remembering}`}
      >
        <div
          className={`${LEARNED_COLOR} h-full transition-all duration-500`}
          style={{ width: `${width(learned)}%` }}
        />
        <div
          className={`${REMEMBERING_COLOR} h-full transition-all duration-500`}
          style={{ width: `${width(remembering)}%` }}
        />
      </div>
    </div>
  )
}
