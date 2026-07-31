import { useState } from 'react'
import type { GraphemeOutcome, MatchResult, Phase } from '../hooks/useStudyQueue'
import { GRADE_LABEL, type Grade } from '../lib/sm2'
import type { Phoneme } from '../lib/types'

interface Props {
  group: Phoneme
  phase: Phase
  outcomes: GraphemeOutcome[]
  rejected: string[]
  foundCount: number
  onSubmitSpelling: (text: string) => MatchResult
  onSubmitExample: (graphemeId: string, text: string) => MatchResult
  onCheck: () => void
  onCommit: () => void
}

const input =
  'rounded-lg border bg-white px-3 py-2 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500'
const chip = 'rounded-full px-3 py-1 text-sm font-medium'

const GRADE_CHIP: Record<Grade, string> = {
  1: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  3: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  5: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
}

/** Input that flashes red when the typed word isn't in the answer list. */
function AnswerInput({
  placeholder,
  onSubmit,
  autoFocus,
  onEmptySubmit,
}: {
  placeholder: string
  onSubmit: (text: string) => MatchResult
  autoFocus?: boolean
  onEmptySubmit?: () => void
}) {
  const [text, setText] = useState('')
  const [bad, setBad] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) {
          onEmptySubmit?.()
          return
        }
        const result = onSubmit(text)
        if (result === 'miss') {
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
        autoFocus={autoFocus}
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className={`${input} ${
          bad ? 'border-rose-500 text-rose-600' : 'border-slate-300 dark:border-slate-600'
        }`}
      />
    </form>
  )
}

function GroupHeader({ group }: { group: Phoneme }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold">{group.note || '(nhóm chưa có ghi chú)'}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">
        {group.type === 'vowel' ? 'nguyên âm' : 'phụ âm'} · {group.graphemes.length} cách viết
      </div>
    </div>
  )
}

function SpellPhase({
  group,
  outcomes,
  rejected,
  foundCount,
  onSubmitSpelling,
  onCheck,
}: Pick<Props, 'group' | 'outcomes' | 'rejected' | 'foundCount' | 'onSubmitSpelling' | 'onCheck'>) {
  return (
    <>
      <GroupHeader group={group} />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Âm này được tạo bởi những chữ / cặp chữ nào?
      </p>

      <div className="flex min-h-9 flex-wrap justify-center gap-2">
        {outcomes
          .filter((o) => o.spellingFound)
          .map((o) => (
            <span
              key={o.grapheme.id}
              className={`${chip} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`}
            >
              ✓ {o.grapheme.spelling}
            </span>
          ))}
        {rejected.map((r) => (
          <span
            key={r}
            className={`${chip} bg-rose-100 text-rose-700 line-through dark:bg-rose-950 dark:text-rose-300`}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <AnswerInput
          placeholder="gõ cách viết, Enter để thêm"
          onSubmit={onSubmitSpelling}
          onEmptySubmit={onCheck}
          autoFocus
        />
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>
            đã đúng {foundCount}/{group.graphemes.length}
          </span>
          <button
            type="button"
            onClick={onCheck}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Kiểm tra →
          </button>
        </div>
      </div>
    </>
  )
}

function OutcomeRow({
  outcome,
  onSubmitExample,
}: {
  outcome: GraphemeOutcome
  onSubmitExample: (graphemeId: string, text: string) => MatchResult
}) {
  const [revealed, setRevealed] = useState(false)
  const { grapheme: g, spellingFound, examplesFound, grade } = outcome
  const missing = g.examples.filter((ex) => !examplesFound.includes(ex))
  const showAnswers = revealed || !spellingFound

  return (
    <li className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className={spellingFound ? 'text-emerald-600' : 'text-rose-600'}>
          {spellingFound ? '✓' : '✗'}
        </span>
        <span className="text-lg font-bold">{g.spelling}</span>
        <span className={`${chip} ${GRADE_CHIP[grade]}`}>{GRADE_LABEL[grade]}</span>
        {g.examples.length === 0 && (
          <span className="text-xs text-slate-400">chưa có từ ví dụ</span>
        )}
      </div>

      {g.examples.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {examplesFound.map((ex) => (
              <span
                key={ex}
                className={`${chip} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`}
              >
                {ex}
              </span>
            ))}
            {showAnswers &&
              missing.map((ex) => (
                <span key={ex} className={`${chip} bg-slate-100 text-slate-500 dark:bg-slate-700`}>
                  {ex}
                </span>
              ))}
          </div>

          {spellingFound && missing.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <AnswerInput
                placeholder={`ví dụ cho "${g.spelling}"`}
                onSubmit={(t) => onSubmitExample(g.id, t)}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                còn {missing.length}
              </span>
              {!revealed && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="text-xs text-sky-600 hover:underline dark:text-sky-400"
                >
                  hiện đáp án
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function RevealPhase({
  group,
  outcomes,
  onSubmitExample,
  onCommit,
}: Pick<Props, 'group' | 'outcomes' | 'onSubmitExample' | 'onCommit'>) {
  const missed = outcomes.filter((o) => !o.spellingFound).length

  return (
    <>
      <GroupHeader group={group} />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {missed === 0
          ? 'Đúng hết cách viết. Gõ thêm từ ví dụ để được điểm Tốt.'
          : `Thiếu ${missed} cách viết. Gõ ví dụ cho những cách viết bạn nhớ được.`}
      </p>

      <ul className="space-y-2">
        {outcomes.map((o) => (
          <OutcomeRow key={o.grapheme.id} outcome={o} onSubmitExample={onSubmitExample} />
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
      {props.phase === 'spell' ? (
        <SpellPhase
          group={props.group}
          outcomes={props.outcomes}
          rejected={props.rejected}
          foundCount={props.foundCount}
          onSubmitSpelling={props.onSubmitSpelling}
          onCheck={props.onCheck}
        />
      ) : (
        <RevealPhase
          group={props.group}
          outcomes={props.outcomes}
          onSubmitExample={props.onSubmitExample}
          onCommit={props.onCommit}
        />
      )}
    </div>
  )
}
