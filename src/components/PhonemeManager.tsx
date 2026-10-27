import { useRef, useState } from 'react'
import type { Grapheme, Phoneme, PhonemeType } from '../lib/types'
import { useStore } from '../hooks/useStore'
import { isLearned } from '../lib/sm2'

const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium'
const input =
  'rounded-lg border border-slate-300 bg-white/60 px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none'

function AddPhonemeForm() {
  const { addPhoneme } = useStore()
  const [type, setType] = useState<PhonemeType>('vowel')
  const [note, setNote] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addPhoneme(type, note.trim() || undefined)
    setNote('')
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

function PhonemeCard({ phoneme }: { phoneme: Phoneme }) {
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
    <article className="cp-panel p-4">
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
    </article>
  )
}

export function PhonemeManager() {
  const { data } = useStore()
  const [filter, setFilter] = useState<'all' | PhonemeType>('all')

  const list = data.phonemes.filter((p) => filter === 'all' || p.type === filter)

  return (
    <div className="space-y-4">
      <AddPhonemeForm />

      <div className="flex gap-2">
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
          {list.length} âm
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có âm nào.</p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <PhonemeCard key={p.id} phoneme={p} />
          ))}
        </div>
      )}
    </div>
  )
}
