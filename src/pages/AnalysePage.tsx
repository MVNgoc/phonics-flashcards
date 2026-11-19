import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { useSpeech } from '../hooks/useSpeech'
import {
  analyse,
  splitSyllables,
  stressOptions,
  type AnalysedSyllable,
  type SplitCandidate,
} from '../lib/analyse'

type Mode = 'guide' | 'tool'

const MODES: { value: Mode; label: string }[] = [
  { value: 'guide', label: 'Các bước' },
  { value: 'tool', label: 'Phân tích từ' },
]

const input =
  'w-full border-0 border-b-2 border-slate-900 bg-transparent px-3 py-2.5 text-lg focus:border-sky-600 focus:outline-none'

const ghostButton =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-sky-500 hover:text-sky-600'

const GUIDE: { title: string; items: { text: string; example?: string }[] }[] = [
  {
    title: 'Chia âm tiết (đặt dấu chấm)',
    items: [
      { text: 'Số âm tiết ≤ số nguyên âm (e câm cuối từ không tính).' },
      { text: 'Ưu tiên double consonants: chia ở giữa hai phụ âm giống nhau.', example: 'let·ter, rab·bit' },
      { text: 'Ưu tiên từ gốc.', example: 'teach·er, speak·er, na·tur·al·ly' },
      {
        text: 'Tách các cụm hậu tố: -ly, -al, -er, -ic, -ology, -ality, -ing, -est, -ent, -ence, -tion, -tious…',
        example: 'bi·o·lo·gy, re·al·i·ty',
      },
      { text: 'Một phụ âm đơn giữa hai nguyên âm: đặt dấu chấm trước phụ âm đó.', example: 'na·tu·ral, ti·ger' },
      {
        text: 'Nhiều phụ âm liền nhau: sau khi đã ưu tiên xong, đặt dấu chấm ở đâu cũng được (ở giữa hai phụ âm).',
        example: 'bas·ket = bask·et',
      },
    ],
  },
  {
    title: 'Shades of sounds',
    items: [{ text: 'Áp dụng 15 quy tắc cho từng âm tiết vừa chia.' }],
  },
  {
    title: 'Đặt dấu nhấn',
    items: [
      { text: 'Nguyên âm được nhấn thì giữ nguyên theo bước 2.' },
      { text: 'Nguyên âm không được nhấn thì rớt /u/ (70%) hoặc /i/ (30%).' },
      { text: 'Luôn luôn nhấn: /sh/u/n/ (-tion), /i/k/ (-ic), /i/t/./i/ (-ity).', example: 'sta·tion, mu·sic, ac·tiv·i·ty' },
      { text: 'Luôn luôn nhấn âm tiết -que.', example: 'u·nique, tech·nique' },
      { text: 'ace, age, ate: danh từ / tính từ → /i/; động từ → /ai/.', example: 'pal·ace, vil·lage / cre·ate' },
      {
        text: 'Từ 4 âm tiết: 20% nhấn âm 1, 40% nhấn âm 2, 40% nhấn âm 3, không bao giờ nhấn âm cuối. Nhấn âm 2 → các âm còn lại rớt hết. Nhấn âm 3 → âm 1 giữ nguyên, âm 2 và 4 rớt.',
      },
    ],
  },
  {
    title: 'Đọc thử và chọn',
    items: [
      { text: 'Đọc thử các trường hợp, chọn trường hợp có dấu nhấn hay nhất.' },
      { text: 'Nếu tất cả đều dở → bước 1 sai, quay lại chia âm tiết.' },
    ],
  },
]

export function AnalysePage() {
  const [params, setParams] = useSearchParams()
  const mode = (MODES.find((m) => m.value === params.get('mode'))?.value ?? 'guide') as Mode

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg border border-slate-600 p-0.5 text-sm font-semibold">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setParams({ mode: m.value }, { replace: true })}
            aria-pressed={mode === m.value}
            className={`flex-1 rounded-md px-3 py-1.5 uppercase tracking-wider ${
              mode === m.value ? 'cp-btn' : 'text-slate-500 hover:text-sky-600'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'guide' ? <Guide /> : <Tool />}
    </div>
  )
}

function Guide() {
  return (
    <ol className="space-y-4">
      {GUIDE.map((step, i) => (
        <li key={step.title} className="cp-panel p-4">
          <div className="flex items-baseline gap-3">
            <span className="cp-neon text-2xl font-semibold tabular-nums text-rose-500">{i + 1}</span>
            <h2 className="font-display text-lg font-semibold">{step.title}</h2>
            {i === 1 && (
              <Link to="/rules" className="ml-auto text-sm text-sky-600 underline">
                Xem 15 quy tắc
              </Link>
            )}
          </div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {step.items.map((it) => (
              <li key={it.text}>
                {it.text}
                {it.example && <span className="ml-2 font-mono text-sm text-slate-500">{it.example}</span>}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

const dots = (c: SplitCandidate) => c.syllables.map((s) => s.text).join('·')

function Tool() {
  const { settings } = useSettings()
  const speech = useSpeech(settings.dictationVoice)

  const [query, setQuery] = useState('')
  const [verb, setVerb] = useState(false)

  const word = query.toLowerCase().replace(/[^a-z]/g, '')
  const splits = useMemo(() => splitSyllables(word), [word])
  const hasAceAgeAte = splits.some((c) => c.syllables.length > 1 && /a(ce|ge|te)$/.test(c.syllables[c.syllables.length - 1].text))

  return (
    <div className="space-y-5">
      <div className="cp-panel p-4">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setVerb(false)
          }}
          placeholder="Gõ một từ tiếng Anh, vd: naturally, teacher, unique"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={input}
        />
        {hasAceAgeAte && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verb} onChange={(e) => setVerb(e.target.checked)} />
            Đây là động từ (ace, age, ate → /ai/; danh từ / tính từ → /i/)
          </label>
        )}
      </div>

      {word && splits.length === 0 && <p className="cp-panel p-6 text-center text-slate-500">Không phân tích được từ này.</p>}

      {splits.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {splits.length === 1 ? '1 cách chia âm tiết' : `${splits.length} cách chia âm tiết đều hợp lệ`}. Mỗi cách chia kèm các phương án dấu nhấn.
            Nghe từ rồi chọn phương án nhấn hay nhất.
          </p>

          {splits.map((c) => {
            const syls = c.syllables
            const shades = analyse(syls, -1, { verb, reduce: {} })
            return (
              <section key={dots(c)} className="cp-panel space-y-4 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Bước 1 · Chia âm tiết</p>
                  <h2 className="font-mono text-2xl font-semibold">{dots(c)}</h2>
                  {c.notes.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-slate-500">
                      {[...new Set(c.notes)].map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Bước 2 · Shades of sounds</p>
                  <ul className="mt-1 space-y-1">
                    {shades.map((r, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-mono">{highlight(r)}</span>
                        <span className="text-sm text-slate-500">
                          {r.shade.rule !== null && <b className="mr-1 text-rose-500">#{r.shade.rule}</b>}
                          {r.shade.explain}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Bước 3 · Đặt dấu nhấn</p>
                  {(() => {
                    const opts = stressOptions(syls)
                    const top = Math.max(...opts.map((o) => o.chance ?? 0))
                    const main = opts.filter((o) => (o.chance ?? 0) === top)
                    const rest = opts.filter((o) => (o.chance ?? 0) !== top)
                    const row = (o: (typeof opts)[number]) => (
                      <div key={o.index} className="mt-2">
                        <p className="text-sm">
                          <b>Nhấn âm {o.index + 1}</b>
                          {o.chance !== null && <span className="ml-1 text-slate-500">({o.chance}%)</span>}
                          {o.reason && <span className="ml-2 text-slate-500">{o.reason}</span>}
                        </p>
                        <Chips result={analyse(syls, o.index, { verb, reduce: {} })} stress={o.index} />
                      </div>
                    )
                    return (
                      <>
                        {main.map(row)}
                        {rest.length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-sky-600">
                              Xem thêm {rest.length} phương án ({rest.map((o) => `${o.chance}%`).join(', ')})
                            </summary>
                            {rest.map(row)}
                          </details>
                        )}
                      </>
                    )
                  })()}
                </div>
              </section>
            )
          })}

          <Step n={4} title="Đọc thử và chọn">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={ghostButton} onClick={() => speech.speak(word)}>
                🔊 Nghe từ
              </button>
              <button type="button" className={ghostButton} onClick={() => speech.speak(word, 0.6)}>
                🐢 Chậm
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Đọc thử từng phương án ở trên, chọn phương án có dấu nhấn hay nhất. Nếu tất cả đều dở → bước 1 sai, xem lại cách chia âm tiết.
            </p>
          </Step>
        </>
      )}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="cp-panel p-4">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="cp-neon text-2xl font-semibold tabular-nums text-rose-500">{n}</span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function highlight(r: AnalysedSyllable) {
  const { start, end } = r.shade
  return (
    <>
      {r.text.slice(0, start)}
      <span className="text-rose-500 underline decoration-2 underline-offset-4">{r.text.slice(start, end)}</span>
      {r.text.slice(end)}
    </>
  )
}

const STATE_LABEL: Record<AnalysedSyllable['state'], string> = {
  stressed: 'nhấn',
  kept: 'giữ nguyên',
  reduced: 'rớt',
  fixed: 'cố định',
}

function Chips({ result, stress }: { result: AnalysedSyllable[]; stress: number }) {
  return (
    <div className="mt-1 flex flex-wrap items-start gap-2">
      {result.map((r, i) => (
        <div
          key={i}
          className={`rounded-lg border px-3 py-2 ${r.state === 'stressed' ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
        >
          <span className="font-mono text-lg">
            {r.state === 'stressed' && i === stress && <span className="text-rose-500">ˈ</span>}
            {r.text}
          </span>
          <span className={`block text-sm ${r.state === 'reduced' ? 'font-semibold text-sky-700' : 'text-slate-600'}`}>
            /{r.sound}/{r.state === 'reduced' && r.sound === 'u' && <span className="font-normal opacity-60"> hoặc /i/</span>}{' '}
            <span className="text-xs opacity-60">{STATE_LABEL[r.state]}</span>
          </span>
          {r.note && <span className="block text-xs text-slate-500">{r.note}</span>}
        </div>
      ))}
    </div>
  )
}
