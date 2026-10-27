import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { useSpeech } from '../hooks/useSpeech'
import { useStore } from '../hooks/useStore'
import {
  alignItems,
  formatAnswer,
  gradeDictation,
  nucleusKeys,
  mixedQueue,
  parseBreakdown,
  serializeTokens,
  stressedSyllable,
  tokenDisplay,
  tokensByKey,
  withExtraAnswers,
  type Answer,
  type DictationItem,
  type ParsedInput,
} from '../lib/dictation'
import { SPELLING_TIPS, TIPS_SOURCE, tipStats, tipsFor, type TipStats } from '../lib/spellingTips'
// ?url: file JSON thô có hash, tải bằng fetch — nhỏ hơn và parse nhanh hơn để Vite biến thành module JS.
import pronunciationsUrl from '../data/pronunciations.json?url'
import practiceWordsUrl from '../data/practiceWords.json?url'

type Prons = Record<string, string[]>

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

const chip = 'rounded-full px-3 py-1 text-sm font-medium'
const chipGreen = `${chip} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`
const chipRed = `${chip} bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300`
const inputClass =
  'w-full border-0 border-b-2 border-slate-900 bg-transparent px-3 py-2 text-center text-lg focus:border-sky-600 focus:outline-none'
const ghostButton =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-sky-500 hover:text-sky-600 dark:border-slate-600'

export function DictationPage() {
  const { data, addExtraAnswer, removeExtraAnswer } = useStore()
  const { settings, update } = useSettings()
  const speech = useSpeech(settings.dictationVoice)
  const [source, setSource] = useState<{ prons: Prons; practice: string[] } | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Từ điển phát âm (~115KB gzip) + từ luyện thêm (~30KB gzip), chỉ tải khi mở trang này.
  useEffect(() => {
    Promise.all([fetchJson<Prons>(pronunciationsUrl), fetchJson<string[]>(practiceWordsUrl)])
      .then(([prons, practice]) => setSource({ prons, practice }))
      .catch(() => setLoadError(true))
  }, [])

  // Căn ~10k từ mất cỡ nửa giây: chỉ làm lại khi bảng âm đổi. Thêm đáp án riêng thì
  // chỉ gắn lại đáp án (withExtraAnswers), không căn lại.
  const aligned = useMemo(
    () => (source ? alignItems(data.phonemes, source.prons, source.practice) : null),
    [data.phonemes, source],
  )
  const built = useMemo(
    () => (aligned ? withExtraAnswers(aligned, data.extraAnswers ?? {}, data.phonemes) : null),
    [aligned, data.extraAnswers, data.phonemes],
  )
  const itemsByWord = useMemo(() => new Map(built?.items.map((i) => [i.word, i])), [built])
  const tips = useMemo(() => (aligned ? tipStats(aligned.items) : new Map<string, TipStats>()), [aligned])
  /** '' = mọi từ; còn lại là id của mẹo chính tả đang luyện riêng. */
  const [tipFilter, setTipFilter] = useState('')
  const nuclei = useMemo(() => nucleusKeys(data.phonemes), [data.phonemes])
  // Cách gõ hợp lệ theo bảng: dạng chuẩn hoá → dạng hiển thị ("oo(l)" → "oo (L)").
  const labels = useMemo(() => tokensByKey(data.phonemes), [data.phonemes])

  // Thứ tự từ chốt lúc bắt đầu phiên. Đáp án tra lại theo từ, nên sửa bảng hay
  // thêm đáp án giữa phiên là thấy ngay.
  const [queue, setQueue] = useState<string[] | null>(null)
  const [pos, setPos] = useState(0)
  const [stats, setStats] = useState({ done: 0, perfect: 0 })

  if (loadError) {
    return <div className="cp-panel p-10 text-center">Không tải được từ điển phát âm. Thử tải lại trang.</div>
  }
  if (!built) {
    return <div className="cp-panel p-10 text-center text-slate-500">Đang tải từ điển phát âm…</div>
  }

  const poolFor = (filter: string) => {
    if (!filter) return built.items
    const words = new Set(tips.get(filter)?.words)
    return built.items.filter((i) => words.has(i.word))
  }
  const start = (filter = tipFilter) => {
    setQueue(mixedQueue(poolFor(filter)))
    setPos(0)
    setStats({ done: 0, perfect: 0 })
  }
  const fromTable = built.items.filter((i) => i.fromTable).length
  const word = queue?.[pos]
  const item = word ? itemsByWord.get(word) : undefined

  return (
    <div className="space-y-5 md:pt-[6vh]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
        <select
          value={tipFilter}
          onChange={(e) => {
            setTipFilter(e.target.value)
            // Đang luyện thì đổi bộ từ ngay; chưa bắt đầu thì chờ bấm Bắt đầu.
            if (queue) start(e.target.value)
          }}
          title="Luyện mọi từ, hoặc chỉ những từ có một đuôi chính tả"
          className="max-w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
        >
          <option value="">
            Mọi từ ({built.items.length})
          </option>
          {SPELLING_TIPS.filter((t) => tips.get(t.id)?.words.length).map((t) => (
            <option key={t.id} value={t.id}>
              Mẹo: {t.sound} → {t.spelling} ({tips.get(t.id)!.words.length})
            </option>
          ))}
        </select>
        <span className="flex shrink-0 flex-wrap items-center gap-3">
          {speech.voices.length > 0 && (
            <select
              value={speech.voice?.voiceURI ?? ''}
              onChange={(e) => update({ dictationVoice: e.target.value })}
              title="Giọng đọc"
              className="max-w-[12rem] rounded-lg border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
            >
              {speech.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
          {queue && (
            <span>
              đã nghe {stats.done} · đúng hết {stats.perfect} · còn {queue.length - pos}
            </span>
          )}
        </span>
      </div>

      {speech.supported && speech.voices.length > 0 && !speech.hasBritish && (
        <p className="rounded-lg border border-amber-500/50 p-3 text-sm text-amber-700">
          Máy chưa có giọng Anh-Anh (en-GB) nên đang đọc bằng giọng tiếng Anh khác. Cài thêm giọng English (UK)
          trong cài đặt giọng nói của hệ điều hành rồi tải lại trang.
        </p>
      )}

      {!speech.supported && (
        <p className="rounded-lg border border-amber-500/50 p-3 text-sm text-amber-700">
          Trình duyệt này không có Web Speech API nên không đọc được từ. Thử Chrome, Edge hoặc Safari.
        </p>
      )}

      {!queue ? (
        <StartPanel
          count={poolFor(tipFilter).length}
          fromTable={tipFilter ? null : fromTable}
          onStart={() => start()}
        />
      ) : item ? (
        <DictationCard
          key={`${pos}-${item.word}`}
          item={item}
          nuclei={nuclei}
          labels={labels}
          speak={speech.speak}
          onGraded={(perfect) => setStats((s) => ({ done: s.done + 1, perfect: s.perfect + (perfect ? 1 : 0) }))}
          onNext={() => setPos((p) => p + 1)}
          onAddAnswer={(answer) => addExtraAnswer(item.word, answer)}
          onRemoveAnswer={(answer) => removeExtraAnswer(item.word, answer)}
          tipStats={tips}
        />
      ) : word ? (
        // Từ bị bỏ khỏi bảng giữa phiên.
        <SkipMissing onSkip={() => setPos((p) => p + 1)} />
      ) : (
        <div className="cp-panel p-10 text-center">
          <p className="text-lg font-medium">Hết từ rồi 🎉</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Đúng hết {stats.perfect}/{stats.done} từ.
          </p>
          <button type="button" onClick={() => start()} className="cp-btn mt-4 rounded-lg px-4 py-2 text-sm">
            Luyện lại (xáo thứ tự mới)
          </button>
        </div>
      )}
    </div>
  )
}

function StartPanel({
  count,
  fromTable,
  onStart,
}: {
  count: number
  /** Số từ ví dụ trong bảng; null khi đang lọc theo mẹo. */
  fromTable: number | null
  onStart: () => void
}) {
  return (
    <div className="cp-panel space-y-4 p-5 text-center md:p-8">
      <div>
        <p className="text-lg font-medium">{count} từ, trộn đều dễ – vừa – khó</p>
        {fromTable !== null && (
          <ul className="mx-auto mt-1 max-w-md space-y-0.5 text-left text-sm text-slate-500 dark:text-slate-400">
            <li>
              · <b>{fromTable}</b> từ ví dụ trong bộ âm của bạn ở trang{' '}
              <Link to="/manage" className="underline hover:text-rose-500">
                Quản lý
              </Link>{' '}
              (các từ ví dụ của mọi âm, mọi trường hợp)
            </li>
            <li>
              · <b>{count - fromTable}</b> từ thêm từ từ điển phát âm Anh-Anh{' '}
              <a
                href="https://github.com/JoseLlarena/Britfone"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-rose-500"
              >
                Britfone
              </a>{' '}
              — từ 2 âm tiết trở lên, chính tả Anh-Anh, phân tích được bằng bộ âm của bạn
            </li>
          </ul>
        )}
      </div>
      <div className="mx-auto max-w-md space-y-1 text-left text-sm text-slate-500 dark:text-slate-400">
        <p>
          Gõ âm cách nhau bằng <code>/</code> hoặc dấu cách, <code>.</code> ngăn âm tiết, <code>'</code> đặt trước
          âm tiết được nhấn:
        </p>
        <p className="text-center font-mono text-slate-900">'/d/or/./t/ur/ &nbsp;=&nbsp; 'd or . t ur</p>
        <p>
          Âm có biến thể thì ghi rõ trong ngoặc: <code>oo (L)</code> / <code>oo (S)</code> (long / short oo),{' '}
          <code>th (UV)</code> / <code>th (V)</code> (th vô thanh / hữu thanh), vd <code>/th (UV)/i/ng/k/</code>.
        </p>
        <p>
          Chấm riêng ba phần: <b>âm</b> (đúng thứ tự, không chấm chỗ đặt dấu chấm), <b>nhấn âm</b> (âm tiết thứ
          mấy) và <b>từ gốc</b>. Từ một âm tiết không cần dấu nhấn.
        </p>
      </div>
      <button type="button" onClick={onStart} className="cp-btn rounded-lg px-5 py-2.5 text-sm">
        Bắt đầu 🔊
      </button>
    </div>
  )
}

function SkipMissing({ onSkip }: { onSkip: () => void }) {
  useEffect(onSkip, [onSkip])
  return null
}

/** Âm tiết (từ 0) chứa hạt nhân được nhấn trong phân tích người dùng gõ. */
function inputStressedSyllable(input: ParsedInput, nuclei: Set<string>): number | null {
  if (input.stress === null) return null
  let seen = 0
  for (let k = 0; k < input.syllables.length; k++) {
    seen += input.syllables[k].filter((t) => nuclei.has(t)).length
    if (seen > input.stress) return k
  }
  return null
}

function DictationCard({
  item,
  nuclei,
  labels,
  speak,
  onGraded,
  onNext,
  onAddAnswer,
  onRemoveAnswer,
  tipStats,
}: {
  item: DictationItem
  nuclei: Set<string>
  labels: Map<string, string>
  speak: (text: string, rate?: number) => void
  onGraded: (perfect: boolean) => void
  onNext: () => void
  onAddAnswer: (answer: string) => void
  onRemoveAnswer: (answer: string) => void
  tipStats: Map<string, TipStats>
}) {
  const [breakdown, setBreakdown] = useState('')
  const [typedWord, setTypedWord] = useState('')
  const [submitted, setSubmitted] = useState<{ input: ParsedInput; word: string } | null>(null)
  const breakdownRef = useRef<HTMLInputElement>(null)
  const wordRef = useRef<HTMLInputElement>(null)

  // Mỗi từ mới tự đọc một lần.
  useEffect(() => {
    speak(item.word)
  }, [item.word, speak])

  const input = useMemo(() => parseBreakdown(breakdown, nuclei), [breakdown, nuclei])
  // Chấm lại theo đáp án hiện tại: thêm "cách của tôi" là thấy đúng ngay.
  const grade = useMemo(
    () => (submitted ? gradeDictation(item, submitted.input, submitted.word) : null),
    [item, submitted],
  )

  const submit = () => {
    if (!breakdown.trim()) {
      breakdownRef.current?.focus()
      return
    }
    const g = gradeDictation(item, input, typedWord)
    onGraded(g.sounds && g.stress && g.word)
    setSubmitted({ input, word: typedWord })
  }

  const listen = (
    <div className="flex justify-center gap-2">
      <button type="button" onClick={() => speak(item.word)} className="cp-btn rounded-lg px-5 py-2 text-lg">
        🔊 Nghe
      </button>
      <button type="button" onClick={() => speak(item.word, 0.6)} className={ghostButton} title="Đọc chậm">
        🐢 Chậm
      </button>
    </div>
  )

  if (!grade || !submitted) {
    return (
      <div className="cp-panel space-y-4 p-5 md:p-8">
        {listen}
        <form
          className="mx-auto max-w-md space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            ref={breakdownRef}
            value={breakdown}
            onChange={(e) => setBreakdown(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              // Enter khi ô trống = nghe lại; có chữ thì sang ô từ gốc.
              if (!breakdown.trim()) speak(item.word)
              else wordRef.current?.focus()
            }}
            placeholder="phân tích âm, vd: '/d/or/./t/ur/"
            autoFocus
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
          />
          <InputPreview input={input} nuclei={nuclei} labels={labels} />
          <input
            ref={wordRef}
            value={typedWord}
            onChange={(e) => setTypedWord(e.target.value)}
            placeholder="từ gốc, Enter để chấm"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
          />
          <button type="submit" className="cp-btn w-full rounded-lg px-4 py-2.5 text-sm">
            Chấm
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Enter ở ô phân tích = sang ô từ gốc (ô trống = nghe lại) · gõ rõ biến thể: oo (L), oo (S), th (UV), th (V)
        </p>
      </div>
    )
  }

  const { answer } = grade
  const others = item.answers.filter((a) => a !== answer)
  const allKnown = submitted.input.tokens.length > 0 && submitted.input.tokens.every((t) => labels.has(t))
  const mine = serializeTokens(submitted.input.tokens)
  const stressNumber = (n: number | null) => (n === null ? 'chưa đánh dấu' : `âm tiết thứ ${n + 1}`)

  return (
    <div className="cp-panel space-y-5 p-5 md:p-8">
      <div className="text-center">
        <div className="cp-neon text-4xl font-bold md:text-5xl">{item.word}</div>
      </div>
      {listen}

      <ul className="mx-auto max-w-md space-y-1.5 text-sm">
        <ResultRow ok={grade.sounds} label="Âm" />
        <ResultRow
          ok={grade.stress}
          label="Nhấn âm"
          detail={
            answer.nuclei > 1 && !grade.stress
              ? `bạn: ${stressNumber(inputStressedSyllable(submitted.input, nuclei))} · đúng: ${stressNumber(stressedSyllable(answer))}`
              : undefined
          }
        />
        <ResultRow
          ok={grade.word}
          label="Từ gốc"
          detail={grade.word ? undefined : `bạn gõ "${submitted.word.trim() || '(trống)'}"`}
        />
      </ul>

      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-400">Bạn gõ</h3>
        <div className="flex flex-wrap gap-1.5">
          {submitted.input.tokens.map((t, k) => (
            <span key={k} className={grade.inputMarks[k] ? chipGreen : chipRed}>
              {tokenDisplay(labels.get(t) ?? t)}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-400">
          {grade.sounds ? 'Đáp án khớp' : 'Đáp án gần nhất'}
        </h3>
        <AnswerView answer={answer} labels={labels} />
        {answer.guessed && (
          <p className="text-xs text-amber-700">
            Máy đoán: có chữ không nằm trong bảng âm, coi là chữ câm. Bạn phân tích khác thì thêm làm đáp án.
          </p>
        )}
        {answer.source === 'user' && <p className="text-xs text-slate-400">Đáp án bạn đã thêm.</p>}
      </section>

      <TipsSection item={item} stats={tipStats} />

      {others.length > 0 && (
        <section className="space-y-1">
          <h3 className="text-xs uppercase tracking-widest text-slate-400">Cũng được chấp nhận</h3>
          <ul className="space-y-1 font-mono text-sm">
            {others.map((a) => (
              <li key={a.tokens.join(' ')} className="flex items-center gap-2">
                <span>{formatAnswer(a, labels)}</span>
                {a.source === 'user' && (
                  <button
                    type="button"
                    onClick={() => onRemoveAnswer(serializeTokens(a.tokens))}
                    className="text-xs text-slate-400 hover:text-rose-500"
                    title="Bỏ đáp án bạn đã thêm"
                  >
                    × bỏ
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!grade.sounds && allKnown && (
          <button type="button" onClick={() => onAddAnswer(mine)} className={ghostButton}>
            Cách của tôi cũng đúng → thêm vào đáp án
          </button>
        )}
        {answer.source === 'user' && grade.sounds && (
          <button type="button" onClick={() => onRemoveAnswer(mine)} className={ghostButton}>
            Bỏ đáp án này
          </button>
        )}
      </div>

      <button type="button" onClick={onNext} autoFocus className="cp-btn w-full rounded-lg px-4 py-2.5 text-sm">
        Từ tiếp →
      </button>
    </div>
  )
}

/** Mẹo chính tả khớp với đuôi của từ, kèm cách từ này viết và số liệu trong bộ luyện. */
function TipsSection({ item, stats }: { item: DictationItem; stats: Map<string, TipStats> }) {
  const hits = tipsFor(item)
  if (!hits.length) return null
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-slate-400">Mẹo chính tả</h3>
      {hits.map(({ tip, spelling }) => {
        const spellings = stats.get(tip.id)?.spellings ?? []
        return (
          <div key={tip.id} className="border border-slate-300 p-3 text-sm">
            <p className="font-semibold">
              {tip.sound} → <span className="text-sky-600">{tip.spelling}</span>
              <span className="ml-2 font-normal text-slate-400">
                · từ này viết <b className="text-slate-900">-{spelling}</b>
              </span>
            </p>
            <p className="mt-1 text-slate-500">{tip.explain}</p>
            {spellings.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Trong bộ luyện:{' '}
                {spellings
                  .slice(0, 5)
                  .map(([sp, n]) => `-${sp} ${n}`)
                  .join(' · ')}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Nguồn:{' '}
              <a href={TIPS_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-rose-500">
                {TIPS_SOURCE.title}
              </a>
              , {tip.stage}
            </p>
          </div>
        )
      })}
    </section>
  )
}

function ResultRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-2">
      <span className={ok ? 'text-emerald-500' : 'text-rose-500'}>{ok ? '✓' : '✗'}</span>
      <span className="font-semibold">{label}</span>
      {detail && <span className="text-slate-500 dark:text-slate-400">{detail}</span>}
    </li>
  )
}

/** Xem trước phân tích đang gõ: chia âm tiết, tô âm tiết nhấn, gạch đỏ nhãn không có trong bảng. */
function InputPreview({
  input,
  nuclei,
  labels,
}: {
  input: ParsedInput
  nuclei: Set<string>
  labels: Map<string, string>
}) {
  if (!input.tokens.length) return <div className="h-7" />
  const stressed = inputStressedSyllable(input, nuclei)
  return (
    <div className="flex min-h-7 flex-wrap items-center justify-center gap-1 text-sm">
      {input.syllables.map((syl, k) => (
        <span key={k} className="flex items-center gap-1">
          {k > 0 && <span className="text-slate-500">.</span>}
          <span
            className={`rounded border px-1.5 py-0.5 ${
              k === stressed ? 'border-sky-500 text-sky-600' : 'border-slate-300 text-slate-700'
            }`}
          >
            {k === stressed && 'ˈ'}
            {syl.map((t, i) => (
              <span key={i} className={labels.has(t) ? '' : 'text-rose-500 line-through'} title={labels.has(t) ? undefined : 'không có âm này trong bảng'}>
                /{labels.get(t) ?? t}
              </span>
            ))}
            /
          </span>
        </span>
      ))}
    </div>
  )
}

/** Đáp án theo âm tiết: nhãn âm ở trên, cụm chữ tạo ra nó ở dưới; âm tiết nhấn viền xanh. */
function AnswerView({ answer, labels }: { answer: Answer; labels: Map<string, string> }) {
  if (!answer.steps) {
    return <p className="font-mono text-lg">{formatAnswer(answer, labels)}</p>
  }
  const stressed = stressedSyllable(answer)
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {answer.syllables.map((syl, k) => (
        <div
          key={k}
          className={`relative flex gap-1 rounded-lg border px-2 pb-1 pt-2 ${
            k === stressed ? 'border-sky-500' : 'border-slate-300'
          }`}
        >
          {k === stressed && (
            <span className="absolute -top-2.5 left-1.5 bg-slate-50 px-1 text-xs text-sky-600">ˈnhấn</span>
          )}
          {syl.map((s, i) => (
            <div key={i} className="flex min-w-[2rem] flex-col items-center">
              <span className="font-bold">{tokenDisplay(s.token)}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{s.spelling || '·'}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
