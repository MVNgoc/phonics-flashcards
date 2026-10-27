import { useState, type ReactNode } from 'react'
import type { ItemOutcome, MatchResult, Phase } from '../hooks/useStudyQueue'
import type { DeckGroup, DeckItem, Direction } from '../lib/deck'
import { GRADE_LABEL, type Grade } from '../lib/sm2'

interface Props {
  direction: Direction
  group: DeckGroup
  phase: Phase
  pending: DeckItem | null
  outcomes: ItemOutcome[]
  rejected: string[]
  foundCount: number
  allFound: boolean
  showCaseCount: boolean
  onSubmitAnswer: (text: string) => MatchResult
  onSubmitExample: (text: string) => MatchResult
  onSkipExamples: () => void
  onRevisitExamples: (itemId: string) => void
  onFinish: () => void
  onCommit: () => void
}

/** Câu chữ khác nhau giữa hai chiều; còn lại hai chiều dùng chung một thẻ. */
const COPY: Record<
  Direction,
  { unit: string; question: string; placeholder: string; examplePrompt: (item: DeckItem) => ReactNode }
> = {
  forward: {
    unit: 'trường hợp',
    question: 'Những trường hợp nào tạo nên âm này?',
    placeholder: 'gõ trường hợp, Enter',
    examplePrompt: (item) => (
      <>
        Đúng rồi. Cho <b>một</b> ví dụ dùng{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">{item.spelling}</span>{' '}
        đọc thành âm này:
      </>
    ),
  },
  reverse: {
    unit: 'âm',
    question: 'Cách viết này tạo ra những âm nào?',
    placeholder: 'gõ âm, vd: ai hoặc /ai/, Enter',
    examplePrompt: (item) => (
      <>
        Đúng rồi. Cho <b>một</b> ví dụ có cách viết này đọc thành{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">{item.sound}</span>:
      </>
    ),
  },
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
        className={`w-full border-0 border-b-2 bg-transparent px-3 py-2 text-center text-lg focus:border-sky-600 focus:outline-none ${
          bad ? 'cp-shake border-rose-500 text-rose-600' : 'border-slate-900'
        }`}
      />
    </form>
  )
}

function GroupHeader({
  direction,
  group,
  showCaseCount,
}: {
  direction: Direction
  group: DeckGroup
  showCaseCount: boolean
}) {
  return (
    <div className="text-center">
      <div key={group.id} className="cp-neon cp-glitch text-5xl font-bold md:text-6xl">
        {group.prompt}
      </div>
      <div className="mt-2 text-xs uppercase tracking-widest text-slate-500">
        {group.kind}
        {showCaseCount && ` · ${group.items.length} ${COPY[direction].unit}`}
      </div>
    </div>
  )
}

/**
 * Những đáp án đã gõ đúng, kèm ví dụ đã gõ được. Đáp án còn nợ ví dụ có nút để
 * gõ bù bất cứ lúc nào.
 */
function FoundList({
  outcomes,
  activeId,
  onRevisitExamples,
}: {
  outcomes: ItemOutcome[]
  activeId: string | null
  onRevisitExamples: (itemId: string) => void
}) {
  const done = outcomes.filter((o) => o.found)
  if (done.length === 0) return null

  return (
    <ul className="space-y-1.5">
      {done.map((o) => (
        <li key={o.item.id} className="flex flex-wrap items-center gap-2">
          <span className={chipGreen}>✓ {o.item.answer}</span>
          {o.examplesFound.map((ex) => (
            <span key={ex} className="text-sm text-slate-500 dark:text-slate-400">
              {ex}
            </span>
          ))}
          {o.item.examples.length > 0 &&
            o.examplesFound.length === 0 &&
            (o.item.id === activeId ? (
              <span className="text-sm text-sky-600 dark:text-sky-400">← đang gõ ví dụ</span>
            ) : (
              <button
                type="button"
                onClick={() => onRevisitExamples(o.item.id)}
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
  direction,
  group,
  pending,
  outcomes,
  rejected,
  foundCount,
  allFound,
  showCaseCount,
  onSubmitAnswer,
  onSubmitExample,
  onSkipExamples,
  onRevisitExamples,
  onFinish,
}: Omit<Props, 'phase' | 'onCommit'>) {
  const copy = COPY[direction]
  const typedExamples = pending ? (outcomes.find((o) => o.item.id === pending.id)?.examplesFound ?? []) : []
  const missingExamples = pending ? pending.examples.length - typedExamples.length : 0
  const owing = outcomes.filter(
    (o) => o.found && o.item.examples.length > 0 && o.examplesFound.length === 0,
  ).length

  return (
    <>
      <GroupHeader direction={direction} group={group} showCaseCount={showCaseCount} />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {pending
          ? copy.examplePrompt(pending)
          : allFound
            ? `Đủ ${copy.unit} rồi — gõ bù ví dụ còn thiếu hoặc xem đáp án.`
            : copy.question}
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
          key={pending ? `ex-${pending.id}-${typedExamples.length}` : 'answer'}
          placeholder={
            pending
              ? direction === 'forward'
                ? `ví dụ cho "${pending.spelling}"`
                : `ví dụ "${pending.spelling}" = ${pending.sound}`
              : allFound
                ? 'Enter để xem đáp án'
                : copy.placeholder
          }
          onSubmit={pending ? onSubmitExample : onSubmitAnswer}
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
              {showCaseCount && `/${group.items.length}`}
              {owing > 0 && ` · nợ ${owing} ví dụ`}
            </span>
            <button
              type="button"
              onClick={onFinish}
              className="cp-btn rounded-lg px-3 py-1.5"
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
  direction,
  group,
  outcomes,
  onCommit,
}: Pick<Props, 'direction' | 'group' | 'outcomes' | 'onCommit'>) {
  const missed = outcomes.filter((o) => !o.found)
  const { unit } = COPY[direction]

  return (
    <>
      {/* Đã tới lúc xem đáp án nên luôn hiện số đáp án. */}
      <GroupHeader direction={direction} group={group} showCaseCount />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {missed.length === 0
          ? `Đúng hết ${unit}.`
          : `Thiếu ${missed.length}/${group.items.length} ${unit}.`}
      </p>

      <ul className="space-y-2">
        {outcomes.map((o) => (
          <li
            key={o.item.id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={o.found ? 'text-emerald-600' : 'text-rose-600'}>
                {o.found ? '✓' : '✗'}
              </span>
              <span className="text-lg font-bold">{o.item.answer}</span>
              <span className={`${chip} ${GRADE_CHIP[o.grade]}`}>{GRADE_LABEL[o.grade]}</span>
              {o.item.examples.length === 0 && (
                <span className="text-xs text-slate-400">chưa có ví dụ</span>
              )}
            </div>

            {o.item.examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {o.item.examples.map((ex) => (
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
        className="cp-btn w-full rounded-lg px-4 py-2.5 text-sm"
      >
        Chấm & thẻ tiếp
      </button>
    </>
  )
}

export function TypingCard(props: Props) {
  return (
    <div className="cp-panel space-y-4 p-5 md:p-8">
      {props.phase === 'answer' ? (
        <AnswerPhase {...props} />
      ) : (
        <SummaryPhase
          direction={props.direction}
          group={props.group}
          outcomes={props.outcomes}
          onCommit={props.onCommit}
        />
      )}
    </div>
  )
}
