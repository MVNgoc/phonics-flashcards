import type { Grapheme, Phoneme, StudyMode } from '../lib/types'

interface Props {
  phoneme: Phoneme
  grapheme: Grapheme
  mode: StudyMode
  flipped: boolean
  onFlip: () => void
}

const faceClasses =
  'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center ' +
  'border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ' +
  '[backface-visibility:hidden]'

export function Flashcard({ phoneme, grapheme, mode, flipped, onFlip }: Props) {
  const spellingFirst = mode === 'spelling-to-sound'

  const front = spellingFirst ? (
    <>
      <span className="text-6xl font-bold tracking-wide">{grapheme.spelling}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400">Âm này đọc là gì?</span>
    </>
  ) : (
    <>
      <span className="text-6xl font-bold">{phoneme.ipa}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Âm này viết bằng những cách nào?
      </span>
    </>
  )

  const back = (
    <>
      <span className="text-5xl font-bold">{spellingFirst ? phoneme.ipa : grapheme.spelling}</span>
      <span className="text-xs uppercase tracking-widest text-slate-400">
        {phoneme.type === 'vowel' ? 'nguyên âm' : 'phụ âm'}
        {spellingFirst ? '' : ` · ${phoneme.ipa}`}
      </span>
      {grapheme.examples.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {grapheme.examples.map((ex) => (
            <span
              key={ex}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-700"
            >
              {ex}
            </span>
          ))}
        </div>
      )}
      {!spellingFirst && phoneme.graphemes.length > 1 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Các cách viết khác: {phoneme.graphemes
            .filter((g) => g.id !== grapheme.id)
            .map((g) => g.spelling)
            .join(', ')}
        </p>
      )}
      {phoneme.note && (
        <p className="text-xs italic text-slate-500 dark:text-slate-400">{phoneme.note}</p>
      )}
    </>
  )

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label="Lật thẻ"
      className="block h-72 w-full [perspective:1200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl"
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className={faceClasses}>{front}</div>
        <div className={`${faceClasses} [transform:rotateY(180deg)]`}>{back}</div>
      </div>
    </button>
  )
}
