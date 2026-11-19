import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { useSpeech } from '../hooks/useSpeech'
import {
  analyse,
  dictionaryInfo,
  splitSyllables,
  stressOptions,
  type AnalysedSyllable,
  type SplitCandidate,
} from '../lib/analyse'
import pronunciationsUrl from '../data/pronunciations.json?url'

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
      { text: 'Ưu tiên từ gốc.', example: 'teach·er, speak·er, nat·ur·al·ly' },
      {
        text: 'Tách các cụm hậu tố: -ly, -al, -er, -ic, -ology, -ality, -ing, -est, -ent, -ence, -tion, -tious…',
        example: 'bi·o·lo·gy, re·al·i·ty',
      },
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

function usePronunciations(): Record<string, string[]> | null {
  const [prons, setProns] = useState<Record<string, string[]> | null>(null)
  useEffect(() => {
    let alive = true
    fetch(pronunciationsUrl)
      .then((r) => r.json() as Promise<Record<string, string[]>>)
      .then((d) => alive && setProns(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return prons
}

const dots = (c: SplitCandidate) => c.syllables.map((s) => s.text).join('·')

function Tool() {
  const { settings } = useSettings()
  const speech = useSpeech(settings.dictationVoice)
  const prons = usePronunciations()

  const [query, setQuery] = useState('')
  const [splitPick, setSplitPick] = useState<number | null>(null)
  const [stressPick, setStressPick] = useState<number | null>(null)
  const [verb, setVerb] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [reduce, setReduce] = useState<Record<number, 'u' | 'i'>>({})

  const word = query.toLowerCase().replace(/[^a-z]/g, '')
  const dict = useMemo(() => dictionaryInfo(prons?.[word]?.[0]), [prons, word])

  // Cách chia khớp số âm tiết trong từ điển được xếp lên đầu.
  const splits = useMemo(() => {
    const all = splitSyllables(word)
    if (!dict) return all
    return [...all].sort((a, b) => Number(b.syllables.length === dict.syllables) - Number(a.syllables.length === dict.syllables))
  }, [word, dict])

  const split = splits[splitPick ?? 0]
  const syls = split?.syllables ?? []
  const stressOpts = useMemo(() => stressOptions(syls), [syls])
  const dictFits = !!dict && dict.syllables === syls.length
  const fromDict = dictFits ? stressOpts.find((o) => o.index === dict!.stress)?.index : undefined
  const defaultStress =
    fromDict ??
    stressOpts.reduce((best, o) => ((o.chance ?? 0) > (best.chance ?? 0) ? o : best), stressOpts[0])?.index ??
    0
  const stress = stressPick ?? defaultStress
  const result = split ? analyse(syls, stress, { verb, reduce }) : []
  const hasAceAgeAte = syls.length > 1 && /a(ce|ge|te)$/.test(syls[syls.length - 1].text)

  function onQuery(v: string) {
    setQuery(v)
    setSplitPick(null)
    setStressPick(null)
    setReduce({})
    setReveal(false)
  }

  return (
    <div className="space-y-5">
      <div className="cp-panel p-4">
        <input
          autoFocus
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Gõ một từ tiếng Anh, vd: naturally, teacher, unique"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={input}
        />
      </div>

      {word && !split && <p className="cp-panel p-6 text-center text-slate-500">Không phân tích được từ này.</p>}

      {split && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {reveal ? 'Đang hiện gợi ý.' : 'Tự phân tích trên giấy trước, rồi xem gợi ý để đối chiếu.'}
          </p>
          <button type="button" className={ghostButton} aria-pressed={reveal} onClick={() => setReveal((r) => !r)}>
            {reveal ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          </button>
        </div>
      )}

      {split && reveal && (
        <>
          <Step n={1} title="Chia âm tiết">
            <p className="text-sm text-slate-500">
              {syls.length} âm tiết. Chọn cách chia hợp lý nhất
              {dict ? ` (từ điển: ${dict.syllables} âm tiết)` : ''}.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {splits.map((c, i) => (
                <button
                  key={dots(c)}
                  type="button"
                  onClick={() => {
                    setSplitPick(i)
                    setStressPick(null)
                    setReduce({})
                  }}
                  aria-pressed={(splitPick ?? 0) === i}
                  className={`rounded-lg border px-3 py-1.5 font-mono ${
                    (splitPick ?? 0) === i ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300 hover:border-sky-500'
                  }`}
                >
                  {dots(c)}
                </button>
              ))}
            </div>
            {split.notes.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-500">
                {[...new Set(split.notes)].map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </Step>

          <Step n={2} title="Shades of sounds">
            <ul className="space-y-1.5">
              {result.map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-base">{highlight(r)}</span>
                  <span className="text-sm text-slate-500">
                    {r.shade.rule !== null && <b className="mr-1 text-rose-500">#{r.shade.rule}</b>}
                    {r.shade.explain}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              <Link to="/rules" className="text-sky-600 underline">
                Xem 15 quy tắc
              </Link>
            </p>
          </Step>

          <Step n={3} title="Đặt dấu nhấn">
            {stressOpts.length === 1 ? (
              <p className="text-sm text-slate-500">{stressOpts[0].reason ?? 'Từ 1 âm tiết: nhấn luôn âm tiết này.'}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stressOpts.map((o) => (
                  <button
                    key={o.index}
                    type="button"
                    onClick={() => setStressPick(o.index)}
                    aria-pressed={stress === o.index}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      stress === o.index ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300 hover:border-sky-500'
                    }`}
                  >
                    Nhấn âm {o.index + 1}
                    {o.chance !== null && <span className="ml-1 opacity-60">({o.chance}%)</span>}
                  </button>
                ))}
              </div>
            )}
            {hasAceAgeAte && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={verb} onChange={(e) => setVerb(e.target.checked)} />
                Đây là động từ (-{syls[syls.length - 1].text.slice(-3)} → /ai/; danh từ / tính từ → /i/)
              </label>
            )}
            <p className="mt-3 text-sm text-slate-500">
              Nguyên âm không nhấn rớt /u/ (70%) hoặc /i/ (30%). Bấm vào âm đã rớt để đổi qua lại.
            </p>
            <Chips result={result} stress={stress} reduce={reduce} onToggle={(i) => setReduce((r) => ({ ...r, [i]: (r[i] ?? 'u') === 'u' ? 'i' : 'u' }))} />
          </Step>

          <Step n={4} title="Đọc thử và chọn">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={ghostButton} onClick={() => speech.speak(word)}>
                🔊 Nghe từ
              </button>
              <button type="button" className={ghostButton} onClick={() => speech.speak(word, 0.6)}>
                🐢 Chậm
              </button>
            </div>
            {dict ? (
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Từ điển: <span className="font-mono">{dict.ipa}</span> · {dict.syllables} âm tiết · nhấn âm {dict.stress + 1}
                </p>
                <p className={dictFits && dict.stress === stress ? 'text-emerald-700' : 'text-rose-600'}>
                  {!dictFits
                    ? `Số âm tiết lệch (${syls.length} so với ${dict.syllables}) → có thể bước 1 sai, thử cách chia khác.`
                    : dict.stress === stress
                      ? 'Dấu nhấn khớp từ điển.'
                      : `Từ điển nhấn âm ${dict.stress + 1}, bạn đang chọn âm ${stress + 1}.`}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Từ này chưa có trong từ điển phát âm của app, hãy nghe thử và tự chọn.</p>
            )}
            <p className="mt-3 text-sm text-slate-500">
              Nghe từ rồi thử đọc từng phương án (đổi cách chia ở bước 1, dấu nhấn ở bước 3), chọn phương án nhấn hay nhất. Nếu tất cả đều dở → bước 1
              sai, quay lại chia âm tiết.
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

function Chips({
  result,
  stress,
  reduce,
  onToggle,
}: {
  result: AnalysedSyllable[]
  stress: number
  reduce: Record<number, 'u' | 'i'>
  onToggle: (i: number) => void
}) {
  return (
    <div className="mt-2 flex flex-wrap items-start gap-2">
      {result.map((r, i) => {
        const body = (
          <>
            <span className="font-mono text-lg">
              {r.state === 'stressed' && i === stress && <span className="text-rose-500">ˈ</span>}
              {r.text}
            </span>
            <span className={`block text-sm ${r.state === 'reduced' ? 'font-semibold text-sky-700' : 'text-slate-600'}`}>
              /{r.sound}/ <span className="text-xs opacity-60">{STATE_LABEL[r.state]}</span>
            </span>
            {r.note && <span className="block text-xs text-slate-500">{r.note}</span>}
          </>
        )
        const cls = `rounded-lg border px-3 py-2 text-left ${
          r.state === 'stressed' ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
        }`
        return r.state === 'reduced' ? (
          <button key={i} type="button" onClick={() => onToggle(i)} className={`${cls} hover:border-sky-500`} title={`Đổi /${reduce[i] ?? 'u'}/ ↔ /${(reduce[i] ?? 'u') === 'u' ? 'i' : 'u'}/`}>
            {body}
          </button>
        ) : (
          <div key={i} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
