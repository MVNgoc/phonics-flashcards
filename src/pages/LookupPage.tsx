import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import {
  allSpellingKeys,
  highlightExample,
  lookupSound,
  lookupSpelling,
  normalizeQuery,
  spellingKey,
  type LookupHit,
} from '../lib/lookup'
import type { Phoneme } from '../lib/types'

type Mode = 'spelling' | 'sound'

const MODES: { value: Mode; label: string }[] = [
  { value: 'spelling', label: 'Chữ → Âm' },
  { value: 'sound', label: 'Âm → Chữ' },
]

/** Chuyển tab / tra một chữ khác. Mỗi lần đổi là một bước lịch sử, Back quay lại được. */
type Go = (mode: Mode, q: string) => void

const chipBtn =
  'rounded-lg bg-slate-100 px-2 py-0.5 font-semibold hover:bg-sky-100 hover:text-sky-700 dark:bg-slate-800 dark:hover:bg-sky-900 dark:hover:text-sky-300'
const label = (p: Phoneme) => p.note || '(chưa đặt nhãn)'

const input =
  'w-full border-0 border-b-2 border-slate-900 bg-transparent px-1 py-2.5 text-lg focus:border-sky-600 focus:outline-none'

function Example({ word, spelling }: { word: string; spelling: string }) {
  return (
    <span>
      {highlightExample(word, spelling).map((s, i) =>
        s.hit ? (
          <b key={i} className="text-sky-600 dark:text-sky-400">
            {s.text}
          </b>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </span>
  )
}

function HitCard({ hit, go }: { hit: LookupHit; go: Go }) {
  const { phoneme, grapheme } = hit
  // Chỉ hiện tên trường hợp khi có chú thích — còn lại nó trùng với chữ đang tra.
  const annotated = spellingKey(grapheme.spelling) !== grapheme.spelling.trim().toLowerCase()
  return (
    <li className="cp-panel p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <button
          type="button"
          onClick={() => go('sound', phoneme.note ?? '')}
          disabled={!phoneme.note}
          title="Xem mọi cách viết của âm này"
          className="text-lg font-bold hover:text-sky-600 dark:hover:text-sky-400"
        >
          {label(phoneme)}
        </button>
        {annotated && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{grapheme.spelling}</span>
        )}
      </div>
      {grapheme.examples.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có ví dụ.</p>
      ) : (
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          {grapheme.examples.map((ex) => (
            <Example key={ex} word={ex} spelling={grapheme.spelling} />
          ))}
        </p>
      )}
    </li>
  )
}

function HitGroup({ title, hits, go }: { title: string; hits: LookupHit[]; go: Go }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      {hits.length === 0 ? (
        <p className="text-sm text-slate-400">(không có)</p>
      ) : (
        <ul className="space-y-2">
          {hits.map((h) => (
            <HitCard key={h.grapheme.id} hit={h} go={go} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function LookupPage() {
  const [params, setParams] = useSearchParams()
  const mode: Mode = params.get('mode') === 'sound' ? 'sound' : 'spelling'
  const query = params.get('q') ?? ''

  const toParams = (m: Mode, q: string) => ({ ...(m === 'sound' && { mode: m }), ...(q && { q }) })
  /** Đang gõ thì thay URL tại chỗ, không đẻ một bước lịch sử cho mỗi phím. */
  const setQuery = (q: string) => setParams(toParams(mode, q), { replace: true })
  const go: Go = (m, q) => setParams(toParams(m, q))

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg border border-slate-600 p-0.5 text-sm font-semibold">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => m.value !== mode && go(m.value, '')}
            aria-pressed={mode === m.value}
            className={`flex-1 rounded-md px-3 py-1.5 uppercase tracking-wider ${
              mode === m.value
                ? 'cp-btn'
                : 'text-slate-500 hover:text-sky-600 dark:text-slate-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'spelling' ? (
        <SpellingLookup key="spelling" query={query} setQuery={setQuery} go={go} />
      ) : (
        <SoundLookup key="sound" query={query} setQuery={setQuery} go={go} />
      )}
    </div>
  )
}

interface LookupProps {
  query: string
  setQuery: (q: string) => void
  go: Go
}

const relatedHelp = (q: string) =>
  `Các cách viết dài hơn có chứa "${q}", có thể đọc khác hẳn. Bấm một cách viết để tra nó.`

function SpellingLookup({ query, setQuery, go }: LookupProps) {
  const { data } = useStore()
  const q = normalizeQuery(query)

  const result = useMemo(() => lookupSpelling(data, query), [data, query])
  const suggestions = useMemo(() => allSpellingKeys(data), [data])

  const vowels = result.exact.filter((h) => h.phoneme.type === 'vowel')
  const consonants = result.exact.filter((h) => h.phoneme.type === 'consonant')
  const countPhonemes = (hits: LookupHit[]) => new Set(hits.map((h) => h.phoneme.id)).size

  return (
    <>
      <div className="space-y-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          list="lookup-spellings"
          placeholder="Gõ chữ hoặc cặp chữ, vd: y, igh, x, a-e"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={input}
        />
        <datalist id="lookup-spellings">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {!q
            ? 'Xem một chữ hay cặp chữ tạo ra những âm nào, kèm ví dụ trong bộ âm của bạn.'
            : result.exact.length === 0
              ? `Chưa có âm nào viết là "${q}".`
              : `"${q}" tạo ra ${countPhonemes(result.exact)} âm · ${countPhonemes(vowels)} nguyên âm · ${countPhonemes(consonants)} phụ âm`}
        </p>
      </div>

      {result.exact.length > 0 && (
        <>
          <HitGroup title="Nguyên âm" hits={vowels} go={go} />
          <HitGroup title="Phụ âm" hits={consonants} go={go} />
        </>
      )}

      {result.related.length > 0 && (
        <details className="cp-panel p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Cách viết khác có chứa "{q}" ({result.related.length})
            <span className="group relative ml-2 inline-block">
              <button
                type="button"
                // Nằm trong <summary>: chặn để bấm ⓘ (chạm trên điện thoại) không mở/đóng mục.
                onClick={(e) => e.preventDefault()}
                aria-label={relatedHelp(q)}
                className="text-slate-400 hover:text-sky-600 focus:text-sky-600 focus:outline-none dark:hover:text-sky-400 dark:focus:text-sky-400"
              >
                ⓘ
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-normal text-slate-200 shadow-lg group-focus-within:block group-hover:block"
              >
                {relatedHelp(q)}
              </span>
            </span>
          </summary>
          <ul className="mt-3 space-y-2">
            {result.related.map(({ phoneme, grapheme }) => (
              <li key={grapheme.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <button
                  type="button"
                  onClick={() => setQuery(spellingKey(grapheme.spelling))}
                  title="Tra cách viết này"
                  className={chipBtn}
                >
                  {grapheme.spelling}
                </button>
                <span className="font-medium">{label(phoneme)}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {grapheme.examples.slice(0, 3).map((ex, i) => (
                    <span key={ex}>
                      {i > 0 && ', '}
                      <Example word={ex} spelling={grapheme.spelling} />
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

/** Một âm và mọi cách viết của nó, kèm ví dụ. Bấm cách viết để tra ngược. */
function SoundCard({ phoneme, go }: { phoneme: Phoneme; go: Go }) {
  return (
    <li className="cp-panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <span className="text-lg font-bold">{label(phoneme)}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {phoneme.type === 'vowel' ? 'nguyên âm' : 'phụ âm'} · {phoneme.graphemes.length} trường hợp
        </span>
      </div>
      {phoneme.graphemes.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có trường hợp nào.</p>
      ) : (
        <ul className="space-y-2">
          {phoneme.graphemes.map((g) => (
            <li key={g.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => go('spelling', spellingKey(g.spelling))}
                title="Cách viết này còn tạo ra âm nào?"
                className={chipBtn}
              >
                {g.spelling}
              </button>
              {g.examples.length === 0 ? (
                <span className="text-sm text-slate-400">chưa có ví dụ</span>
              ) : (
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {g.examples.map((ex) => (
                    <Example key={ex} word={ex} spelling={g.spelling} />
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function SoundLookup({ query, setQuery, go }: LookupProps) {
  const { data } = useStore()
  const shown = query.trim()

  const result = useMemo(() => lookupSound(data, query), [data, query])
  const labelled = useMemo(() => data.phonemes.filter((p) => p.note?.trim()), [data])

  return (
    <>
      <div className="space-y-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          list="lookup-sounds"
          placeholder="Gõ âm, vd: ai, /igh/, short oo"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={input}
        />
        <datalist id="lookup-sounds">
          {labelled.map((p) => (
            <option key={p.id} value={p.note} />
          ))}
        </datalist>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {!shown
            ? 'Xem một âm có những cách viết nào, kèm ví dụ. Không cần gõ dấu “/”. Hoặc chọn một âm:'
            : result.exact.length === 0
              ? `Chưa có âm nào tên "${shown}".`
              : result.exact.length > 1
                ? `Có ${result.exact.length} âm khớp với "${shown}".`
                : null}
        </p>
      </div>

      {!shown &&
        (['vowel', 'consonant'] as const).map((type) => (
          <section key={type}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {type === 'vowel' ? 'Nguyên âm' : 'Phụ âm'}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {labelled
                .filter((p) => p.type === type)
                .map((p) => (
                  <button key={p.id} type="button" onClick={() => go('sound', p.note ?? '')} className={chipBtn}>
                    {p.note}
                  </button>
                ))}
            </div>
          </section>
        ))}

      {result.exact.length > 0 && (
        <ul className="space-y-2">
          {result.exact.map((p) => (
            <SoundCard key={p.id} phoneme={p} go={go} />
          ))}
        </ul>
      )}

      {result.related.length > 0 && (
        <details className="cp-panel p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Âm khác có chứa "{shown}" ({result.related.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {result.related.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <button
                  type="button"
                  onClick={() => setQuery(p.note ?? '')}
                  title="Xem âm này"
                  className={chipBtn}
                >
                  {p.note}
                </button>
                <span className="text-slate-500 dark:text-slate-400">
                  {p.graphemes.map((g) => g.spelling).join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
