import type { Grapheme, Phoneme } from '../lib/types'

interface Props {
  phoneme: Phoneme
  grapheme: Grapheme
  flipped: boolean
  onFlip: () => void
}

const faceClasses =
  'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center ' +
  'border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ' +
  '[backface-visibility:hidden]'

export function Flashcard({ phoneme, grapheme, flipped, onFlip }: Props) {
  const siblings = phoneme.graphemes.filter((g) => g.id !== grapheme.id).map((g) => g.spelling)

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
        <div className={faceClasses}>
          <span className="text-6xl font-bold tracking-wide">{grapheme.spelling}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">Âm này đọc thế nào?</span>
        </div>

        <div className={`${faceClasses} [transform:rotateY(180deg)]`}>
          <span className="text-3xl font-bold tracking-wide">{grapheme.spelling}</span>
          {grapheme.examples.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {grapheme.examples.map((ex) => (
                <span
                  key={ex}
                  className="rounded-full bg-slate-100 px-3 py-1 text-lg font-medium dark:bg-slate-700"
                >
                  {ex}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Chưa có từ ví dụ</span>
          )}
          {phoneme.note && <p className="text-base font-medium">{phoneme.note}</p>}
          <span className="text-xs uppercase tracking-widest text-slate-400">
            {phoneme.type === 'vowel' ? 'nguyên âm' : 'phụ âm'}
          </span>
          {siblings.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cùng âm: {siblings.join(', ')}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
