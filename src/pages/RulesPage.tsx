import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProgressBar } from '../components/ProgressBar'
import { useSettings } from '../hooks/useSettings'
import { useSpeech } from '../hooks/useSpeech'
import { useStore } from '../hooks/useStore'
import { buildReviewQueue, GRADE_LABEL, isLearned, newReviewState, todayISO, type Grade } from '../lib/sm2'
import {
  buildRuleBank,
  OUTCOME_LABEL,
  pickQuestion,
  RULE_CARDS,
  ruleById,
  markSegments,
  showPron,
  SOUND_RULES,
  weaknessOf,
  type Outcome,
  type RuleBank,
  type RuleException,
  type RuleQuestion,
} from '../lib/soundRules'
import type { ReviewState } from '../lib/types'
import pronunciationsUrl from '../data/pronunciations.json?url'
import ruleWordsUrl from '../data/ruleWords.json?url'

type Mode = 'read' | 'recall' | 'apply'

const MODES: { value: Mode; label: string }[] = [
  { value: 'read', label: 'Đọc' },
  { value: 'recall', label: 'Thuộc lòng' },
  { value: 'apply', label: 'Áp dụng' },
]

const ghostButton =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-sky-500 hover:text-sky-600'

function typing(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

function useRuleBank(): { bank: RuleBank | null; error: boolean } {
  const [bank, setBank] = useState<RuleBank | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all([fetchJson<Record<string, string[]>>(pronunciationsUrl), fetchJson<string[]>(ruleWordsUrl)])
      .then(([prons, words]) => alive && setBank(buildRuleBank(words, prons)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])
  return { bank, error }
}

export function RulesPage() {
  const [params, setParams] = useSearchParams()
  const mode = (MODES.find((m) => m.value === params.get('mode'))?.value ?? 'read') as Mode
  const { bank, error } = useRuleBank()

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

      {mode === 'read' && <ReadMode bank={bank} />}
      {mode === 'recall' && <RecallMode />}
      {mode === 'apply' &&
        (error ? (
          <p className="cp-panel p-6 text-center text-rose-600">Không tải được từ điển phát âm. Thử tải lại trang.</p>
        ) : bank ? (
          <ApplyMode bank={bank} />
        ) : (
          <p className="cp-panel p-6 text-center text-slate-500">Đang tải từ điển…</p>
        ))}
    </div>
  )
}

function MarkedWord({ word, start, end, className = '' }: { word: string; start: number; end: number; className?: string }) {
  return (
    <span className={className}>
      {markSegments(word, start, end).map((seg, i) =>
        seg.asked ? (
          <span key={i} className="text-rose-500 underline decoration-2 underline-offset-4">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  )
}

function cardLevel(r: ReviewState | undefined): 'learned' | 'remembering' | 'new' | 'weak' {
  if (!r || r.nextDue === null) return 'new'
  if (isLearned(r)) return 'learned'
  return r.repetitions >= 1 ? 'remembering' : 'weak'
}

const LEVEL_CHIP: Record<ReturnType<typeof cardLevel>, { text: string; className: string }> = {
  learned: { text: 'đã thuộc', className: 'bg-emerald-100 text-emerald-700' },
  remembering: { text: 'đang nhớ', className: 'bg-slate-200 text-slate-700' },
  weak: { text: 'chưa nhớ', className: 'bg-rose-100 text-rose-700' },
  new: { text: 'chưa học', className: 'bg-slate-100 text-slate-500' },
}

function ReadMode({ bank }: { bank: RuleBank | null }) {
  const { data } = useStore()
  const byRule = useMemo(() => {
    const map = new Map<number, { questions: number; exceptions: RuleException[] }>()
    if (!bank) return map
    for (const r of SOUND_RULES) map.set(r.id, { questions: 0, exceptions: [] })
    const words = new Map<number, Set<string>>()
    for (const q of bank.questions) {
      const set = words.get(q.ruleId) ?? new Set<string>()
      set.add(q.word)
      words.set(q.ruleId, set)
    }
    for (const [id, set] of words) map.get(id)!.questions = set.size
    for (const e of bank.exceptions) map.get(e.ruleId)!.exceptions.push(e)
    for (const v of map.values()) v.exceptions.sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word))
    return map
  }, [bank])

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        14 quy tắc đọc. Số từ đúng quy tắc và ngoại lệ được đếm tự động từ từ điển phát âm giọng Anh của app.
      </p>
      <ol className="space-y-4">
        {SOUND_RULES.map((rule) => {
          const stat = byRule.get(rule.id)
          const quiz = data.ruleQuiz?.[String(rule.id)]
          return (
            <li key={rule.id} className="cp-panel p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="cp-neon text-2xl font-semibold tabular-nums text-rose-500">{rule.id}</span>
                <h2 className="font-display text-lg font-semibold">{rule.title}</h2>
                <span className="ml-auto flex flex-wrap gap-1.5 text-xs">
                  {rule.cards.map((c) => {
                    const lv = LEVEL_CHIP[cardLevel(data.ruleReviews?.[c.id])]
                    return (
                      <span key={c.id} className={`rounded-full px-2 py-0.5 ${lv.className}`} title={c.cue}>
                        {lv.text}
                      </span>
                    )
                  })}
                  {quiz && quiz.recent.length > 0 && (
                    <span
                      className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700"
                      title={`Áp dụng: đúng ${quiz.recent.filter(Boolean).length} trong ${quiz.recent.length} câu gần nhất`}
                    >
                      áp dụng {Math.round((quiz.recent.filter(Boolean).length / quiz.recent.length) * 100)}%
                    </span>
                  )}
                </span>
              </div>
              <p className="mt-2">{rule.text}</p>
              <p className="mt-1 text-sm">
                <span className="text-slate-500">Ví dụ: </span>
                <span className="font-mono">{rule.examples.join(', ')}</span>
              </p>
              {rule.note && <p className="mt-1 text-sm text-slate-500">{rule.note}</p>}
              {stat && (
                <p className="mt-2 border-t border-slate-200 pt-2 text-sm text-slate-500">
                  {stat.questions} từ đúng quy tắc · {stat.exceptions.length} ngoại lệ
                  {stat.exceptions.length > 0 && (
                    <>
                      :{' '}
                      {stat.exceptions.slice(0, 10).map((e, i) => (
                        <span key={e.word} title={`${e.actual} ${bank?.pron.get(e.word) ? showPron(bank.pron.get(e.word)!) : ''}`}>
                          {i > 0 && ', '}
                          <MarkedWord word={e.word} start={e.start} end={e.end} className="font-mono text-slate-700" />
                        </span>
                      ))}
                      {stat.exceptions.length > 10 && '…'}
                    </>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const GRADES: Grade[] = [1, 3, 4, 5]
const GRADE_STYLE: Record<Grade, string> = {
  1: 'border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-slate-50',
  3: 'border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-slate-50',
  4: 'border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-slate-50',
  5: 'border-sky-500 text-sky-700 hover:bg-sky-500 hover:text-slate-50',
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function RecallMode() {
  const { data, gradeRuleCard } = useStore()
  const today = todayISO()
  const [queue, setQueue] = useState<string[]>(() =>
    buildReviewQueue(
      RULE_CARDS.map((c) => ({ id: c.id, reviews: [data.ruleReviews?.[c.id] ?? newReviewState()] })),
      today,
    ),
  )
  const [free, setFree] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const card = RULE_CARDS.find((c) => c.id === queue[0])
  const rule = card ? ruleById(card.ruleId) : undefined

  const progress = useMemo(() => {
    const reviews = RULE_CARDS.map((c) => data.ruleReviews?.[c.id])
    const learned = reviews.filter((r) => r && isLearned(r)).length
    const remembering = reviews.filter((r) => r && !isLearned(r) && r.repetitions >= 1).length
    return { learned, remembering, total: RULE_CARDS.length, percent: Math.round((learned / RULE_CARDS.length) * 100) }
  }, [data.ruleReviews])

  const grade = useCallback(
    (g: Grade) => {
      if (!card) return
      if (!free) gradeRuleCard(card.id, g, today)
      setReviewed((n) => n + 1)
      setFlipped(false)
      setQueue((q) => (g === 1 ? [...q.slice(1), q[0]] : q.slice(1)))
    },
    [card, free, gradeRuleCard, today],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || !card) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped) {
        const i = ['1', '2', '3', '4'].indexOf(e.key)
        if (i !== -1) grade(GRADES[i])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, flipped, grade])

  return (
    <div className="space-y-4">
      <ProgressBar
        percent={progress.percent}
        learned={progress.learned}
        remembering={progress.remembering}
        total={progress.total}
        label="Quy tắc: đã thuộc"
        unit="thẻ"
      />
      <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500">
        <span>Đọc tình huống, tự nhớ kết quả rồi lật thẻ và tự chấm.</span>
        <span>
          còn {queue.length} thẻ · đã chấm {reviewed} lượt{free && ' · luyện tự do'}
        </span>
      </div>

      {card && rule ? (
        <>
          <div key={`${card.id}-${reviewed}`} className="cp-panel cp-glitch p-6 text-center sm:p-10">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Quy tắc {rule.id} · Tình huống</div>
            <div className="cp-neon mt-3 text-2xl font-semibold sm:text-3xl">{card.cue}</div>
            {flipped ? (
              <div className="mt-6 border-t border-slate-300 pt-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Kết quả</div>
                <div className="mt-2 text-xl font-semibold text-rose-500 sm:text-2xl">{card.result}</div>
                <div className="mt-2 font-mono text-slate-600">{card.examples.join(', ')}</div>
                {rule.note && <div className="mt-3 text-sm text-slate-500">{rule.note}</div>}
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {GRADES.map((g, i) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => grade(g)}
                      className={`rounded-lg border-2 px-2 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${GRADE_STYLE[g]}`}
                    >
                      {GRADE_LABEL[g]} <span className="text-xs opacity-60">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setFlipped(true)} className="cp-btn mt-8 rounded-lg px-6 py-2">
                Lật thẻ
              </button>
            )}
          </div>
          <p className="text-center text-xs text-slate-500">
            Space / Enter = lật thẻ · 1 Sai · 2 Khó · 3 Tốt · 4 Dễ · Sai thì thẻ được hỏi lại cuối phiên
          </p>
        </>
      ) : (
        <div className="cp-panel p-10 text-center">
          <p className="text-lg font-medium">Hết thẻ quy tắc cần ôn hôm nay 🎉</p>
          <p className="mt-1 text-sm text-slate-500">
            Quay lại mai để giữ nhịp ôn, hoặc sang Áp dụng để luyện với từ thật.
          </p>
          <button
            type="button"
            onClick={() => {
              setFree(true)
              setQueue(shuffle(RULE_CARDS.map((c) => c.id)))
            }}
            className="cp-btn mt-4 rounded-lg px-4 py-2 text-sm"
          >
            Luyện tự do (không tính tiến độ)
          </button>
        </div>
      )}
    </div>
  )
}

const RECENT_WORDS = 30

function ApplyMode({ bank }: { bank: RuleBank }) {
  const { data, recordRuleQuiz } = useStore()
  const { settings } = useSettings()
  const speech = useSpeech(settings.dictationVoice)
  const [rules, setRules] = useState<number[]>([])
  const [recentWords, setRecentWords] = useState<string[]>([])
  const [question, setQuestion] = useState<RuleQuestion | null>(null)
  const [picked, setPicked] = useState<Outcome | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const weakness = useCallback((id: number) => weaknessOf(data.ruleQuiz?.[String(id)]), [data.ruleQuiz])

  const next = useCallback(
    (ruleFilter: number[], recent: string[]) => {
      const q = pickQuestion(bank.questions, ruleFilter, recent, weakness)
      setQuestion(q)
      setPicked(null)
      if (q) setRecentWords([...recent, q.word].slice(-RECENT_WORDS))
    },
    [bank, weakness],
  )

  useEffect(() => {
    next(rules, recentWords)
  }, [rules])

  const answer = useCallback(
    (o: Outcome) => {
      if (!question || picked) return
      const ok = o === question.answer
      setPicked(o)
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))
      recordRuleQuiz(question.ruleId, ok)
    },
    [question, picked, recordRuleQuiz],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || !question) return
      if (!picked) {
        const i = Number(e.key) - 1
        if (i >= 0 && i < question.options.length) answer(question.options[i])
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next(rules, recentWords)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, picked, answer, next, rules, recentWords])

  const toggleRule = (id: number) =>
    setRules((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id].sort((a, b) => a - b)))

  const rule = question ? ruleById(question.ruleId) : undefined
  const ok = picked !== null && question && picked === question.answer
  const exceptions = useMemo(
    () =>
      question
        ? bank.exceptions
            .filter((e) => e.ruleId === question.ruleId)
            .sort((a, b) => a.word.length - b.word.length)
            .slice(0, 6)
        : [],
    [bank, question],
  )
  const pron = question ? bank.pron.get(question.word) : undefined

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>Chữ tô đỏ đọc thế nào? Chọn rồi xem quy tắc giải thích.</span>
          <span>
            phiên này: đúng {score.right}/{score.total}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => setRules([])}
            aria-pressed={rules.length === 0}
            className={`rounded-lg border px-2.5 py-0.5 ${rules.length === 0 ? 'cp-btn border-rose-500' : 'border-slate-300 hover:border-sky-500'}`}
          >
            Tất cả
          </button>
          {SOUND_RULES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleRule(r.id)}
              aria-pressed={rules.includes(r.id)}
              title={r.title}
              className={`min-w-[2.25rem] rounded-lg border px-2 py-0.5 tabular-nums ${
                rules.includes(r.id) ? 'cp-btn border-rose-500' : 'border-slate-300 hover:border-sky-500'
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {question && rule ? (
        <div key={`${question.word}-${question.start}`} className="cp-panel cp-glitch p-6 text-center sm:p-10">
          <div className="flex items-center justify-center gap-3">
            <MarkedWord
              word={question.word}
              start={question.start}
              end={question.end}
              className="cp-neon text-5xl font-semibold tracking-wide sm:text-6xl"
            />
            {speech.supported && picked && (
              <button
                type="button"
                onClick={() => speech.speak(question.word)}
                title="Nghe từ này"
                className={ghostButton}
              >
                🔊
              </button>
            )}
          </div>

          <div className={`mt-8 grid gap-2 ${question.options.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {question.options.map((o, i) => {
              const isAnswer = o === question.answer
              const isPicked = o === picked
              const style = !picked
                ? 'border-slate-400 hover:border-sky-500 hover:text-sky-600'
                : isAnswer
                  ? 'border-emerald-500 bg-emerald-500 text-slate-50'
                  : isPicked
                    ? 'border-rose-500 bg-rose-500 text-slate-50'
                    : 'border-slate-200 text-slate-400'
              return (
                <button
                  key={o}
                  type="button"
                  disabled={!!picked}
                  onClick={() => answer(o)}
                  className={`rounded-lg border-2 px-3 py-2.5 font-semibold transition-colors ${style}`}
                >
                  {OUTCOME_LABEL[o]} {!picked && <span className="text-xs opacity-50">{i + 1}</span>}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="mt-6 space-y-2 border-t border-slate-300 pt-5 text-left">
              <p className={`font-semibold ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                {ok ? 'Đúng!' : `Chưa đúng — đáp án: ${OUTCOME_LABEL[question.answer]}`}
                {pron && <span className="ml-2 font-mono font-normal text-slate-500">{showPron(pron)}</span>}
              </p>
              <p>
                <span className="font-semibold text-rose-500">Quy tắc {rule.id}</span> · {rule.text}
              </p>
              <p className="text-sm text-slate-500">
                Cụm áp dụng quy tắc:{' '}
                <span className="bg-rose-100 px-1 font-mono font-semibold text-rose-500">
                  {question.word.slice(...(question.cluster ?? [question.start, question.end]))}
                </span>
              </p>
              {exceptions.length > 0 && (
                <p className="text-sm text-slate-500">
                  Ngoại lệ cần nhớ:{' '}
                  {exceptions.map((e, i) => (
                    <span key={e.word}>
                      {i > 0 && ', '}
                      <MarkedWord word={e.word} start={e.start} end={e.end} className="font-mono text-slate-700" />
                    </span>
                  ))}
                </p>
              )}
              <div className="pt-2 text-center">
                <button type="button" onClick={() => next(rules, recentWords)} className="cp-btn rounded-lg px-6 py-2">
                  Tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="cp-panel p-6 text-center text-slate-500">Không còn câu hỏi cho bộ lọc này.</p>
      )}
      <p className="text-center text-xs text-slate-500">
        Phím 1–{question?.options.length ?? 2} = chọn · Enter = câu tiếp · quy tắc hay sai được hỏi nhiều hơn · câu
        hỏi chỉ lấy từ đọc đúng quy tắc, ngoại lệ hiện riêng để bạn biết
      </p>
    </div>
  )
}
