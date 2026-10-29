import { useRef, useState } from 'react'
import type { Grapheme, Phoneme, PhonemeType } from '../lib/types'
import { useStore } from '../hooks/useStore'
import { isLearned } from '../lib/sm2'
import { filterPhonemes } from '../lib/lookup'

const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium'
const input =
  'rounded-lg border border-slate-300 bg-white/60 px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none'

/** Tìm ra từng này âm trở xuống thì tự mở các box đó. */
const AUTO_OPEN_MAX = 3

const SEARCH_HELP =
  'Gõ đủ hai dấu "/" (vd /s/) để chỉ ra đúng âm đó. Gõ một dấu "/" (vd /s) thì ra mọi âm có tên chứa chữ đó (/s/, /ks/, /sh/...). Không có dấu "/" (vd igh) thì tìm cả tên âm lẫn cách viết, nên ra thêm các âm có cách viết chứa chữ đó (vd /ai/ có eigh).'

function AddPhonemeForm({ onAdded }: { onAdded: (id: string) => void }) {
  const { addPhoneme } = useStore()
  const [type, setType] = useState<PhonemeType>('vowel')
  const [note, setNote] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const id = addPhoneme(type, note.trim() || undefined)
    setNote('')
    onAdded(id)
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as PhonemeType)}
        className={input}
      >
        <option value="vowel">Nguyên âm</option>
        <option value="consonant">Phụ âm</option>
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Âm, vd: /æ/"
        className={`${input} flex-1 min-w-40`}
      />
      <button type="submit" className={`${btn} cp-btn`}>
        Thêm âm
      </button>
    </form>
  )
}

/** Một từ ví dụ: bấm vào chữ để sửa tại chỗ, Enter/bấm ra ngoài để lưu, Esc để huỷ. */
function ExampleChip({
  word,
  onRename,
  onRemove,
}: {
  word: string
  onRename: (next: string) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const cancelled = useRef(false)

  if (draft !== null) {
    return (
      <input
        autoFocus
        value={draft}
        size={Math.max(draft.length, 4)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            cancelled.current = true
            e.currentTarget.blur()
          }
        }}
        onBlur={() => {
          if (!cancelled.current) onRename(draft.trim())
          cancelled.current = false
          setDraft(null)
        }}
        aria-label={`Sửa ví dụ ${word}`}
        className={`${input} px-2.5 py-0.5`}
      />
    )
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm dark:bg-slate-700">
      <button
        type="button"
        onClick={() => setDraft(word)}
        title="Bấm để sửa"
        className="hover:text-sky-600"
      >
        {word}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Xoá ví dụ ${word}`}
        className="text-slate-400 hover:text-rose-500"
      >
        ×
      </button>
    </span>
  )
}

function ExampleEditor({ phoneme, grapheme }: { phoneme: Phoneme; grapheme: Grapheme }) {
  const { updateGrapheme } = useStore()
  const [word, setWord] = useState('')

  function add(e: React.FormEvent) {
    e.preventDefault()
    const w = word.trim()
    if (!w || grapheme.examples.includes(w)) {
      setWord('')
      return
    }
    updateGrapheme(phoneme.id, grapheme.id, { examples: [...grapheme.examples, w] })
    setWord('')
  }

  function remove(w: string) {
    updateGrapheme(phoneme.id, grapheme.id, {
      examples: grapheme.examples.filter((x) => x !== w),
    })
  }

  /** Thay tại chỗ để giữ thứ tự; bỏ qua nếu trống, không đổi hoặc trùng ví dụ khác. */
  function rename(oldWord: string, next: string) {
    if (!next || next === oldWord || grapheme.examples.includes(next)) return
    updateGrapheme(phoneme.id, grapheme.id, {
      examples: grapheme.examples.map((x) => (x === oldWord ? next : x)),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {grapheme.examples.map((w) => (
        <ExampleChip
          key={w}
          word={w}
          onRename={(next) => rename(w, next)}
          onRemove={() => remove(w)}
        />
      ))}
      <form onSubmit={add}>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="+ từ ví dụ"
          className={`${input} w-36 py-1`}
        />
      </form>
    </div>
  )
}

function GraphemeRow({ phoneme, grapheme }: { phoneme: Phoneme; grapheme: Grapheme }) {
  const { updateGrapheme, deleteGrapheme } = useStore()
  const r = grapheme.review

  return (
    <li className="flex flex-col gap-2 rounded-lg bg-slate-100/70 p-3 dark:bg-slate-800/60 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={grapheme.spelling}
            onChange={(e) => updateGrapheme(phoneme.id, grapheme.id, { spelling: e.target.value })}
            className={`${input} w-24 font-semibold`}
          />
          {isLearned(r) && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              thuộc
            </span>
          )}
          <span className="text-xs text-slate-400">
            đúng {r.correctCount} · sai {r.wrongCount}
            {r.nextDue ? ` · ôn lại ${r.nextDue}` : ' · chưa học'}
          </span>
        </div>
        <ExampleEditor phoneme={phoneme} grapheme={grapheme} />
      </div>
      <button
        type="button"
        onClick={() => deleteGrapheme(phoneme.id, grapheme.id)}
        className={`${btn} self-start text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950`}
      >
        Xoá trường hợp
      </button>
    </li>
  )
}

/**
 * Box một âm. Thu gọn thì chỉ có dòng tiêu đề (tên, loại, số trường hợp, các
 * cách viết); bấm dòng tiêu đề để mở ra sửa.
 */
function PhonemeCard({
  phoneme,
  open,
  onToggle,
}: {
  phoneme: Phoneme
  open: boolean
  onToggle: () => void
}) {
  const total = phoneme.graphemes.length
  const learned = phoneme.graphemes.filter((g) => isLearned(g.review)).length

  return (
    // Thu gọn: cả box là nút nên đổi màu cả box. Đang mở: chỉ dòng tiêu đề bấm được,
    // nên chỉ đổi màu mũi tên để báo bấm vào sẽ thu lại.
    <article className={`cp-panel transition-colors ${open ? '' : 'hover:bg-slate-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-baseline gap-3 px-4 py-3 text-left"
      >
        <span className="w-3 shrink-0 text-slate-400 group-hover:text-rose-500">{open ? '▾' : '▸'}</span>
        <span className="shrink-0 font-display text-xl font-semibold">
          {phoneme.note || <span className="text-slate-400">(chưa đặt nhãn)</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-slate-500">
            {phoneme.type === 'vowel' ? 'nguyên âm' : 'phụ âm'} · {total} trường hợp · thuộc {learned}/{total}
          </span>
          {!open && total > 0 && (
            <span className="block truncate font-mono text-sm text-slate-700">
              {phoneme.graphemes.map((g) => g.spelling).join(', ')}
            </span>
          )}
        </span>
      </button>
      {open && <PhonemeEditor phoneme={phoneme} />}
    </article>
  )
}

function PhonemeEditor({ phoneme }: { phoneme: Phoneme }) {
  const { updatePhoneme, deletePhoneme, addGrapheme } = useStore()
  const [spelling, setSpelling] = useState('')
  const [confirming, setConfirming] = useState(false)

  function add(e: React.FormEvent) {
    e.preventDefault()
    if (!spelling.trim()) return
    addGrapheme(phoneme.id, spelling.trim())
    setSpelling('')
  }

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={phoneme.type}
          onChange={(e) => updatePhoneme(phoneme.id, { type: e.target.value as PhonemeType })}
          className={input}
        >
          <option value="vowel">Nguyên âm</option>
          <option value="consonant">Phụ âm</option>
        </select>
        <input
          value={phoneme.note ?? ''}
          onChange={(e) => updatePhoneme(phoneme.id, { note: e.target.value || undefined })}
          placeholder="Âm, vd: /æ/"
          className={`${input} flex-1 min-w-40 font-medium`}
        />
        {confirming ? (
          <span className="flex items-center gap-2 text-sm">
            Xoá cả âm này?
            <button
              type="button"
              onClick={() => deletePhoneme(phoneme.id)}
              className={`${btn} cp-btn-danger`}
            >
              Xoá
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={btn}>
              Huỷ
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${btn} text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950`}
          >
            Xoá âm
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {phoneme.graphemes.map((g) => (
          <GraphemeRow key={g.id} phoneme={phoneme} grapheme={g} />
        ))}
      </ul>

      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={spelling}
          onChange={(e) => setSpelling(e.target.value)}
          placeholder="Trường hợp mới, vd ough"
          className={`${input} w-48`}
        />
        <button type="submit" className={`${btn} border border-slate-300 dark:border-slate-600`}>
          + Trường hợp
        </button>
      </form>
    </div>
  )
}

export function PhonemeManager() {
  const { data } = useStore()
  const [filter, setFilter] = useState<'all' | PhonemeType>('all')
  const [query, setQuery] = useState('')
  /** Box âm đang mở; vào trang thì thu gọn hết. */
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  const byType = data.phonemes.filter((p) => filter === 'all' || p.type === filter)
  const list = filterPhonemes(byType, query)
  // Chữ tìm rỗng (kể cả chỉ gõ "/") thì filterPhonemes trả lại nguyên mảng.
  const searching = list !== byType

  const open = (ids: string[]) => setOpenIds((s) => new Set([...s, ...ids]))
  const toggle = (id: string) =>
    setOpenIds((s) => {
      const next = new Set(s)
      if (!next.delete(id)) next.add(id)
      return next
    })
  /** Tìm ra ít kết quả thì mở luôn các box đó để sửa ngay. */
  const search = (q: string) => {
    setQuery(q)
    const found = filterPhonemes(byType, q)
    if (found !== byType && found.length <= AUTO_OPEN_MAX) open(found.map((p) => p.id))
  }

  return (
    <div className="space-y-4">
      {/* Thêm âm thì xoá chữ tìm, không thì âm mới có thể bị lọc mất. */}
      <AddPhonemeForm
        onAdded={(id) => {
          setQuery('')
          open([id])
        }}
      />

      <div className="flex items-center gap-2">
        <label htmlFor="phoneme-search" className="text-sm font-semibold uppercase tracking-[0.12em]">
          Tìm âm
        </label>
        <span className="group relative -ml-1">
          <button
            type="button"
            aria-label={SEARCH_HELP}
            className="text-slate-400 hover:text-sky-600 focus:text-sky-600 focus:outline-none"
          >
            ⓘ
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-72 border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-normal text-slate-200 shadow-lg group-focus-within:block group-hover:block"
          >
            {SEARCH_HELP}
          </span>
        </span>
        <input
          id="phoneme-search"
          value={query}
          onChange={(e) => search(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          placeholder="tên âm hoặc cách viết, vd: ai, igh"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className={`${input} min-w-0 flex-1`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xoá chữ tìm"
            className="px-2 text-lg leading-none text-slate-400 hover:text-rose-500"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'vowel', 'consonant'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${btn} border ${
              filter === f
                ? 'cp-btn border-rose-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'vowel' ? 'Nguyên âm' : 'Phụ âm'}
          </button>
        ))}
        <span className="self-center text-sm text-slate-500 dark:text-slate-400">
          {searching ? `${list.length}/${byType.length}` : list.length} âm
        </span>
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => open(list.map((p) => p.id))}
            className={`${btn} border border-slate-300 dark:border-slate-600`}
          >
            Mở hết
          </button>
          <button
            type="button"
            onClick={() => setOpenIds(new Set())}
            className={`${btn} border border-slate-300 dark:border-slate-600`}
          >
            Thu hết
          </button>
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {searching ? `Không có âm nào khớp "${query.trim()}".` : 'Chưa có âm nào.'}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <PhonemeCard key={p.id} phoneme={p} open={openIds.has(p.id)} onToggle={() => toggle(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
