import { useState } from 'react'
import type { PhonemeType } from '../lib/types'
import { useStore, type ParsedPhoneme } from '../hooks/useStore'

const PLACEHOLDER = `vowel | /æ/ | a: cat, hat | ai: plaid
consonant | /f/ | f: fan | ph: phone, graph`

interface ParseResult {
  parsed: ParsedPhoneme[]
  errors: string[]
}

/** One group per line: `vowel|consonant | âm | spelling: ex1, ex2 | ...` */
export function parseBulk(text: string): ParseResult {
  const parsed: ParsedPhoneme[] = []
  const errors: string[] = []

  text.split('\n').forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return

    const parts = line.split('|').map((p) => p.trim())
    if (parts.length < 3) {
      errors.push(`Dòng ${i + 1}: cần "vowel | âm | trường hợp: ví dụ"`)
      return
    }

    const [rawType, note, ...graphemeParts] = parts
    const typeWord = rawType.toLowerCase()
    if (!typeWord.startsWith('v') && !typeWord.startsWith('c') && !typeWord.startsWith('n')
        && !typeWord.startsWith('p')) {
      errors.push(`Dòng ${i + 1}: cột đầu phải là vowel hoặc consonant`)
      return
    }
    const type: PhonemeType =
      typeWord.startsWith('v') || typeWord.startsWith('n') ? 'vowel' : 'consonant'

    const graphemes = graphemeParts
      .filter(Boolean)
      .map((chunk) => {
        const colon = chunk.indexOf(':')
        const spelling = (colon === -1 ? chunk : chunk.slice(0, colon)).trim()
        const examples =
          colon === -1
            ? []
            : chunk
                .slice(colon + 1)
                .split(',')
                .map((w) => w.trim())
                .filter(Boolean)
        return { spelling, examples }
      })
      .filter((g) => g.spelling.length > 0)

    if (graphemes.length === 0) {
      errors.push(`Dòng ${i + 1}: không có trường hợp nào`)
      return
    }

    parsed.push({ note, type, graphemes })
  })

  return { parsed, errors }
}

export function BulkImport() {
  const { mergeParsed } = useStore()
  const [text, setText] = useState('')
  const [done, setDone] = useState<string | null>(null)

  const { parsed, errors } = parseBulk(text)
  const graphemeCount = parsed.reduce((n, p) => n + p.graphemes.length, 0)

  function submit() {
    if (parsed.length === 0) return
    mergeParsed(parsed)
    setDone(`Đã nhập ${parsed.length} âm / ${graphemeCount} trường hợp.`)
    setText('')
  }

  return (
    <section className="cp-panel p-4">
      <h2 className="mb-1 font-semibold">Nhập nhanh</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Mỗi dòng một âm: <code>vowel | âm | trường hợp: ví dụ, ví dụ | ...</code>. Âm trùng nhãn
        sẽ được gộp thêm, không ghi đè. Nhãn để trống thì luôn tạo âm mới.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setDone(null)
        }}
        rows={6}
        spellCheck={false}
        placeholder={PLACEHOLDER}
        className="w-full rounded-lg border border-slate-600 bg-slate-950/80 p-3 font-mono text-sm focus:border-sky-500 focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={parsed.length === 0}
          className="cp-btn rounded-lg px-4 py-2 text-sm disabled:opacity-40"
        >
          Nhập {parsed.length > 0 ? `${parsed.length} âm` : ''}
        </button>
        {graphemeCount > 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {graphemeCount} trường hợp sẽ được thêm/gộp
          </span>
        )}
        {done && <span className="text-sm text-emerald-600 dark:text-emerald-400">{done}</span>}
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-rose-600 dark:text-rose-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
