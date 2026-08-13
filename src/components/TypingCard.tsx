import { useState } from 'react'
import type { GraphemeOutcome, MatchResult, Phase } from '../hooks/useStudyQueue'
import { GRADE_LABEL, type Grade } from '../lib/sm2'
import type { Grapheme, Phoneme } from '../lib/types'

interface Props {
  group: Phoneme
  phase: Phase
  pending: Grapheme | null
  outcomes: GraphemeOutcome[]
  rejected: string[]
  foundCount: number
  allFound: boolean
  showCaseCount: boolean
  onSubmitSpelling: (text: string) => MatchResult
  onSubmitExample: (text: string) => MatchResult
  onSkipExamples: () => void
  onRevisitExamples: (graphemeId: string) => void
  onFinish: () => void
  onCommit: () => void
}

const chip = 'rounded-full px-3 py-1 text-sm font-medium'
const chipGreen = `${chip} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`
const chipGrey = `${chip} bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300`

const GRADE_CHIP: Record<Grade, string> = {
  1: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  3: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  5: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
}

/** Ô nhập một câu trả lời; nhoè đỏ khi gõ sai, Enter lúc trống thì gọi onEmpty. */
function AnswerInput({
  placeholder,
  onSubmit,
  onEmpty,
}: {
  placeholder: string
  onSubmit: (text: string) => MatchResult
  onEmpty: () => void
}) {
  const [text, setText] = useState('')
  const [bad, setBad] = useState(false)

  return (
    <form
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) {
          onEmpty()
          return
        }
        if (onSubmit(text) === 'miss') {
          setBad(true)
          setTimeout(() => setBad(false), 600)
        }
        setText('')
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-center text-lg dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          bad ? 'border-rose-500 text-rose-600' : 'border-slate-300 dark:border-slate-600'
        }`}
      />
    </form>
  )
}

function GroupHeader({ group, showCaseCount }: { group: Phoneme; showCaseCount: boolean }) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold">{group.note || '(nhóm chưa có nhãn)'}</div>
      <div className="mt-2 text-xs uppercase tracking-widest text-slate-400">
        {group.type === 'vowel' ? 'nguyên âm' : 'phụ âm'}
        {showCaseCount && ` · ${group.graphemes.length} trường hợp`}
      </div>
    </div>
  )
}

/**
 * Những trường hợp đã gõ đúng, kèm ví dụ đã gõ được. Trường hợp còn nợ ví dụ có
 * nút để gõ bù bất cứ lúc nào.
 */
function FoundList({
  outcomes,
  activeId,
  onRevisitExamples,
}: {
  outcomes: GraphemeOutcome[]
  activeId: string | null
  onRevisitExamples: (graphemeId: string) => void
}) {
  const done = outcomes.filter((o) => o.spellingFound)
  if (done.length === 0) return null

  return (
    <ul className="space-y-1.5">
      {done.map((o) => (
        <li key={o.grapheme.id} className="flex flex-wrap items-center gap-2">
          <span className={chipGreen}>✓ {o.grapheme.spelling}</span>
          {o.examplesFound.map((ex) => (
            <span key={ex} className="text-sm text-slate-500 dark:text-slate-400">
              {ex}
            </span>
          ))}
          {o.grapheme.examples.length > 0 &&
            o.examplesFound.length === 0 &&
            (o.grapheme.id === activeId ? (
              <span className="text-sm text-sky-600 dark:text-sky-400">← đang gõ ví dụ</span>
            ) : (
              <button
                type="button"
                onClick={() => onRevisitExamples(o.grapheme.id)}
                className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-400"
              >
                + ví dụ
              </button>
            ))}
        </li>
      ))}
    </ul>
  )
}

function AnswerPhase({
  group,
  pending,
  outcomes,
  rejected,
  foundCount,
  allFound,
  showCaseCount,
  onSubmitSpelling,
  onSubmitExample,
  onSkipExamples,
  onRevisitExamples,
  onFinish,
}: Omit<Props, 'phase' | 'onCommit'>) {
  const typedExamples = pending ? (outcomes.find((o) => o.grapheme.id === pending.id)?.examplesFound ?? []) : []
  const missingExamples = pending ? pending.examples.length - typedExamples.length : 0
  const owing = outcomes.filter(
    (o) => o.spellingFound && o.grapheme.examples.length > 0 && o.examplesFound.length === 0,
  ).length

  return (
    <>
      <GroupHeader group={group} showCaseCount={showCaseCount} />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {pending ? (
          <>
            Đúng rồi. Cho <b>một</b> ví dụ dùng{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{pending.spelling}</span>{' '}
            đọc thành âm này:
          </>
        ) : allFound ? (
          'Đủ trường hợp rồi — gõ bù ví dụ còn thiếu hoặc xem đáp án.'
        ) : (
          'Những trường hợp nào tạo nên âm này?'
        )}
      </p>

      <FoundList
        outcomes={outcomes}
        activeId={pending?.id ?? null}
        onRevisitExamples={onRevisitExamples}
      />

      {rejected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rejected.map((r) => (
            <span
              key={r}
              className={`${chip} bg-rose-100 text-rose-700 line-through dark:bg-rose-950 dark:text-rose-300`}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <AnswerInput
          key={pending ? `ex-${pending.id}-${typedExamples.length}` : 'spelling'}
          placeholder={
            pending
              ? `ví dụ cho "${pending.spelling}"`
              : allFound
                ? 'Enter để xem đáp án'
                : 'gõ trường hợp, Enter'
          }
          onSubmit={pending ? onSubmitExample : onSubmitSpelling}
          onEmpty={pending ? onSkipExamples : onFinish}
        />

        {pending ? (
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>{missingExamples} đáp án được chấp nhận</span>
            <button
              type="button"
              onClick={onSkipExamples}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium dark:border-slate-600"
            >
              Chưa nghĩ ra, để sau →
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              đã đúng {foundCount}
              {showCaseCount && `/${group.graphemes.length}`}
              {owing > 0 && ` · nợ ${owing} ví dụ`}
            </span>
            <button
              type="button"
              onClick={onFinish}
              className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-500"
            >
              Hết rồi, xem đáp án →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function SummaryPhase({
  group,
  outcomes,
  onCommit,
}: Pick<Props, 'group' | 'outcomes' | 'onCommit'>) {
  const missed = outcomes.filter((o) => !o.spellingFound)

  return (
    <>
      {/* Đã tới lúc xem đáp án nên luôn hiện số trường hợp. */}
      <GroupHeader group={group} showCaseCount />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {missed.length === 0
          ? 'Đúng hết trường hợp.'
          : `Thiếu ${missed.length}/${group.graphemes.length} trường hợp.`}
      </p>

      <ul className="space-y-2">
        {outcomes.map((o) => (
          <li
            key={o.grapheme.id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={o.spellingFound ? 'text-emerald-600' : 'text-rose-600'}>
                {o.spellingFound ? '✓' : '✗'}
              </span>
              <span className="text-lg font-bold">{o.grapheme.spelling}</span>
              <span className={`${chip} ${GRADE_CHIP[o.grade]}`}>{GRADE_LABEL[o.grade]}</span>
              {o.grapheme.examples.length === 0 && (
                <span className="text-xs text-slate-400">chưa có ví dụ</span>
              )}
            </div>

            {o.grapheme.examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {o.grapheme.examples.map((ex) => (
                  <span
                    key={ex}
                    className={o.examplesFound.includes(ex) ? chipGreen : chipGrey}
                    title={o.examplesFound.includes(ex) ? 'bạn đã gõ được' : 'chưa gõ được'}
                  >
                    {ex}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCommit}
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
      >
        Chấm & thẻ tiếp
      </button>
    </>
  )
}

export function TypingCard(props: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 p-5 shadow-sm dark:border-slate-700">
      {props.phase === 'answer' ? (
        <AnswerPhase {...props} />
      ) : (
        <SummaryPhase group={props.group} outcomes={props.outcomes} onCommit={props.onCommit} />
      )}
    </div>
  )
}
