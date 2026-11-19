const VOWELS = 'aeiou'
const DIGRAPHS = ['th', 'sh', 'ch', 'ph', 'ck', 'ng', 'wh', 'gh', 'qu']

interface Suffix {
  text: string
  parts: { text: string; fixed?: string }[]
}

// Dài trước ngắn để khớp đuôi dài nhất.
const SUFFIXES: Suffix[] = [
  { text: 'ology', parts: [{ text: 'o' }, { text: 'lo' }, { text: 'gy' }] },
  { text: 'ality', parts: [{ text: 'a' }, { text: 'li' }, { text: 'ty' }] },
  { text: 'tious', parts: [{ text: 'tious', fixed: 'shus' }] },
  { text: 'cious', parts: [{ text: 'cious', fixed: 'shus' }] },
  { text: 'tion', parts: [{ text: 'tion', fixed: 'shun' }] },
  { text: 'sion', parts: [{ text: 'sion', fixed: 'shun' }] },
  { text: 'ence', parts: [{ text: 'ence' }] },
  { text: 'ance', parts: [{ text: 'ance' }] },
  { text: 'ment', parts: [{ text: 'ment' }] },
  { text: 'ness', parts: [{ text: 'ness' }] },
  { text: 'less', parts: [{ text: 'less' }] },
  { text: 'able', parts: [{ text: 'a' }, { text: 'ble' }] },
  { text: 'ible', parts: [{ text: 'i' }, { text: 'ble' }] },
  { text: 'ful', parts: [{ text: 'ful' }] },
  { text: 'ous', parts: [{ text: 'ous' }] },
  { text: 'ity', parts: [{ text: 'i', fixed: 'i' }, { text: 'ty' }] },
  { text: 'ing', parts: [{ text: 'ing' }] },
  { text: 'est', parts: [{ text: 'est' }] },
  { text: 'ent', parts: [{ text: 'ent' }] },
  { text: 'ly', parts: [{ text: 'ly' }] },
  { text: 'al', parts: [{ text: 'al' }] },
  { text: 'er', parts: [{ text: 'er' }] },
  { text: 'ic', parts: [{ text: 'ic', fixed: 'ik' }] },
]

export interface Syllable {
  text: string
  /** Âm cố định của hậu tố (-tion → shun, -ic → ik, -i·ty → i). */
  fixed?: string
  suffix?: boolean
}

export interface SplitCandidate {
  syllables: Syllable[]
  notes: string[]
}

function isVowelAt(w: string, i: number): boolean {
  const c = w[i]
  if (VOWELS.includes(c)) return !(c === 'u' && w[i - 1] === 'q')
  if (c === 'y') return !(i === 0 && VOWELS.includes(w[1] ?? ''))
  return false
}

/** Tách cụm phụ âm thành đơn vị (th, sh, ch… là 1 đơn vị, không được chia đôi). */
function consonantUnits(c: string): string[] {
  const units: string[] = []
  for (let i = 0; i < c.length; i++) {
    const two = c.slice(i, i + 2)
    if (DIGRAPHS.includes(two)) {
      units.push(two)
      i++
    } else units.push(c[i])
  }
  return units
}

/** Vị trí cắt (số đơn vị phụ âm ở lại âm tiết trước). Một phụ âm đơn: dấu chấm đứng trước nó (na·tu·ral). */
function cutOptions(units: string[]): { cuts: number[]; note?: string } {
  if (units.length === 1) return { cuts: [0] }
  for (let i = 0; i < units.length - 1; i++) {
    if (units[i] === units[i + 1]) return { cuts: [i + 1], note: `double consonant ${units[i]}${units[i]}` }
  }
  return { cuts: Array.from({ length: units.length - 1 }, (_, i) => i + 1) }
}

const MAX_CANDIDATES = 12

function splitBase(base: string): { options: string[][]; notes: string[] } {
  const silentE = /[^aeiouy]e$/.test(base) && !/[^aeiouy]le$/.test(base)
  const body = silentE ? base.slice(0, -1) : base
  const groups: [number, number][] = []
  for (let i = 0; i < body.length; i++) {
    if (!isVowelAt(body, i)) continue
    let j = i
    while (j < body.length && isVowelAt(body, j)) j++
    groups.push([i, j])
    i = j - 1
  }
  if (groups.length === 0) return { options: [[base]], notes: [] }

  const boundaries: number[][] = []
  const notes: string[] = []
  for (let g = 0; g < groups.length - 1; g++) {
    const cluster = body.slice(groups[g][1], groups[g + 1][0])
    const units = consonantUnits(cluster)
    const { cuts, note } = cutOptions(units)
    if (note) notes.push(`Ưu tiên ${note}`)
    const leEnding = g === groups.length - 2 && !note && /[^aeiouy]le$/.test(base)
    const useCuts = leEnding ? [Math.max(0, units.length - 2)] : cuts
    const offsets: number[] = useCuts.map((k) => groups[g][1] + units.slice(0, k).join('').length)
    boundaries.push(offsets)
  }

  let combos: number[][] = [[]]
  for (const options of boundaries) {
    const next: number[][] = []
    for (const c of combos) for (const o of options) next.push([...c, o])
    combos = next.slice(0, MAX_CANDIDATES * 4)
  }
  const options = combos.slice(0, MAX_CANDIDATES).map((cutAt) => {
    const out: string[] = []
    let prev = 0
    for (const at of cutAt) {
      out.push(body.slice(prev, at))
      prev = at
    }
    out.push(body.slice(prev) + (silentE ? 'e' : ''))
    return out
  })
  return { options, notes }
}

/** Số âm tiết ≤ số nguyên âm: chỉ chia ở giữa các cụm nguyên âm; e câm cuối từ không tính. */
export function splitSyllables(raw: string): SplitCandidate[] {
  const word = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return []

  // -ed sau phụ âm không phải t, d thì câm (absorbed, accused): dính vào âm tiết cuối.
  const silentEd = /[^aeiouy]ed$/.test(word) && !/[td]ed$/.test(word) && /[aeiouy]/.test(word.slice(0, -2))
  // -s số nhiều đứng sau hậu tố (achievements): dính vào âm tiết cuối.
  const plural = !silentEd && /[^s]s$/.test(word) && SUFFIXES.some((x) => !x.parts.some((p) => p.fixed) && word.slice(0, -1).endsWith(x.text) && word.length - 1 > x.text.length)
  // -es sau phụ âm thường (lines, cakes): e câm, s dính vào âm tiết cuối.
  const silentEs = !silentEd && /[^aeiouysxzcgh]es$/.test(word) && /[aeiouy]/.test(word.slice(0, -2))
  const coda = silentEd ? 'ed' : plural || silentEs ? 's' : ''
  const stem = word.slice(0, word.length - coda.length)

  const suffixes: Suffix[] = []
  let base = stem
  const notes: string[] = []
  for (;;) {
    const s = SUFFIXES.find((x) => base.length > x.text.length && base.endsWith(x.text) && /[aeiouy]/.test(base.slice(0, -x.text.length)))
    if (!s) break
    suffixes.unshift(s)
    base = base.slice(0, -s.text.length)
    notes.push(`Tách hậu tố -${s.text}`)
  }

  // Gấp đôi phụ âm trước hậu tố bắt đầu bằng nguyên âm (run·ning): phụ âm sau chuyển sang hậu tố.
  const first = suffixes[0]
  const shift = first && /[aeiou]/.test(first.text[0]) && /([^aeiouy])\1$/.test(base)
  const moved = shift ? base[base.length - 1] : ''
  if (shift) {
    base = base.slice(0, -1)
    notes.push(`Ưu tiên double consonant ${moved}${moved}`)
  }

  const tail: Syllable[] = suffixes.flatMap((s, si) =>
    s.parts.map((p, pi) => ({
      text: (shift && si === 0 && pi === 0 ? moved : '') + p.text,
      fixed: p.fixed,
      suffix: true,
    })),
  )

  const { options, notes: baseNotes } = splitBase(base)
  return options.map((syls) => {
    const all: Syllable[] = [...syls.map((text) => ({ text })), ...tail]
    if (coda) all[all.length - 1] = { ...all[all.length - 1], text: all[all.length - 1].text + coda }
    return { syllables: all, notes: [...notes, ...baseNotes, ...(silentEd ? ['-ed câm: không tính là âm tiết'] : [])] }
  })
}

// ───────────── Bước 2: Shades of sounds trên từng âm tiết ─────────────

const LONG: Record<string, string> = { a: 'ai', e: 'ee', i: 'igh', o: 'oa', u: 'yoo', y: 'igh' }
const PAIRS = ['ai', 'ea', 'ee', 'oa', 'oe', 'ie', 'ue', 'ui']
const OTHER_DIGRAPH: Record<string, string> = {
  ay: 'ai', ey: 'ee', oy: 'oi', oi: 'oi', ou: 'ow', ow: 'ow', oo: 'oo', au: 'or', aw: 'or', ew: 'yoo',
}

export interface Shade {
  sound: string
  rule: number | null
  explain: string
  /** Vị trí nguyên âm trong âm tiết, để tô. */
  start: number
  end: number
}

export function shadeOf(syl: string, totalSyllables: number, isLast: boolean): Shade {
  let start = -1
  for (let i = 0; i < syl.length; i++)
    if (isVowelAt(syl, i)) {
      start = i
      break
    }
  if (start === -1) return { sound: '', rule: null, explain: 'Không có nguyên âm', start: 0, end: 0 }
  let end = start
  while (end < syl.length && isVowelAt(syl, end)) end++
  const group = syl.slice(start, end)
  const after = syl.slice(end)
  const at = { start, end }

  if (group === 'i' && after.startsWith('gh')) return { ...at, sound: 'igh', rule: 12, explain: 'i đứng trước gh → /igh/, gh câm' }
  if (group.length === 1 && 'eiou'.includes(group) && /^r(?![aeiouy])/.test(after))
    return { ...at, sound: 'ur', rule: 15, explain: `${group} + r → /ur/` }
  if (PAIRS.includes(group))
    return { ...at, end: start + 1, sound: LONG[group[0]], rule: 3, explain: `${group}: nguyên âm đầu đọc dài /${LONG[group[0]]}/, nguyên âm sau câm` }
  if (OTHER_DIGRAPH[group])
    return { ...at, sound: OTHER_DIGRAPH[group], rule: null, explain: `${group} → /${OTHER_DIGRAPH[group]}/ (ngoài 15 quy tắc, học thuộc)` }
  if (group.length > 1)
    return { ...at, sound: '?', rule: null, explain: `Cụm nguyên âm ${group}: chưa có quy tắc, tra từ điển` }

  const v = group
  if (v === 'y' && isLast && after === '')
    return totalSyllables === 1
      ? { ...at, sound: 'igh', rule: null, explain: 'y đứng cuối từ 1 âm tiết → /igh/' }
      : { ...at, sound: 'i', rule: 13, explain: 'y đứng cuối từ nhiều âm tiết → /i/' }
  if (after === '') return { ...at, sound: LONG[v], rule: 1, explain: `${v} đứng cuối âm tiết → dài /${LONG[v]}/` }
  if (/^[^aeiouy]e$/.test(after))
    return { ...at, sound: LONG[v], rule: 14, explain: `e câm cuối → ${v} đọc dài /${LONG[v]}/ (${v}-e)` }
  const short = v === 'y' ? 'i' : v
  return { ...at, sound: short, rule: 2, explain: `${v} có phụ âm đứng sau → giữ nguyên /${short}/` }
}

// ───────────── Bước 3: dấu nhấn ─────────────

export type SyllableState = 'stressed' | 'kept' | 'reduced' | 'fixed'

export interface StressOption {
  index: number
  /** % theo quy tắc từ 4 âm tiết; null khi không có xác suất. */
  chance: number | null
  reason?: string
}

const FIXED_STRESS_BEFORE = (s: Syllable) => s.fixed !== undefined && (s.fixed === 'shun' || s.fixed === 'shus' || s.fixed === 'ik' || s.fixed === 'i')

export function stressOptions(syls: Syllable[]): StressOption[] {
  const n = syls.length
  const que = syls.findIndex((s) => /que$/.test(s.text))
  if (que !== -1) return [{ index: que, chance: null, reason: 'Âm tiết -que luôn được nhấn' }]
  let fixedAt = -1
  syls.forEach((x, i) => {
    if (FIXED_STRESS_BEFORE(x)) fixedAt = i
  })
  if (fixedAt > 0) return [{ index: fixedAt - 1, chance: null, reason: `Âm đuôi -${syls[fixedAt].text} luôn giữ nguyên, nhấn âm tiết ngay trước nó` }]
  if (n === 1) return [{ index: 0, chance: null }]
  if (n === 4)
    return [
      { index: 0, chance: 20 },
      { index: 1, chance: 40 },
      { index: 2, chance: 40 },
    ]
  const last = n - 1
  return Array.from({ length: n <= 3 ? n : last }, (_, i) => ({ index: i, chance: null }))
}

export interface AnalysedSyllable {
  text: string
  state: SyllableState
  /** Âm cuối cùng sau khi áp dụng nhấn / rớt. */
  sound: string
  shade: Shade
  note?: string
}

export interface AnalyseOptions {
  /** Từ có đuôi ace/age/ate dùng làm động từ → /ai/, danh/tính từ → /i/. */
  verb: boolean
  /** Âm rớt của từng âm tiết không nhấn: mặc định /u/ (70%), chọn /i/ (30%). */
  reduce: Record<number, 'u' | 'i'>
}

const ACE_AGE_ATE = /a(ce|ge|te)$/

export function analyse(syls: Syllable[], stress: number, opts: AnalyseOptions): AnalysedSyllable[] {
  const n = syls.length
  return syls.map((s, i) => {
    const shade = shadeOf(s.text, n, i === n - 1)
    if (s.fixed !== undefined)
      return { text: s.text, state: 'fixed', sound: s.fixed, shade, note: `Âm cố định /${s.fixed}/` }
    if (n > 1 && i === n - 1 && ACE_AGE_ATE.test(s.text)) {
      const sound = opts.verb ? 'ai' : 'i'
      return {
        text: s.text,
        state: 'fixed',
        sound,
        shade,
        note: opts.verb ? 'Động từ: a → /ai/' : 'Danh từ / tính từ: a → /i/',
      }
    }
    if (/que$/.test(s.text)) {
      return { text: s.text, state: 'stressed', sound: 'ee', shade: { ...shade, sound: 'ee', explain: '-ique đọc /ee/ + /k/' }, note: 'Luôn nhấn -que' }
    }
    if (i === stress) return { text: s.text, state: 'stressed', sound: shade.sound, shade }
    if (n === 4 && stress === 2 && i === 0) return { text: s.text, state: 'kept', sound: shade.sound, shade, note: 'Giữ nguyên theo bước 2' }
    if (shade.rule === 13) return { text: s.text, state: 'reduced', sound: 'i', shade, note: 'y cuối từ rớt /i/ (quy tắc 13)' }
    return { text: s.text, state: 'reduced', sound: opts.reduce[i] ?? 'u', shade }
  })
}

// ───────────── Dấu nhấn theo từ điển phát âm ─────────────

const IPA_VOWELS = new Set([
  'æ', 'ɑː', 'ɛ', 'ɪ', 'i', 'iː', 'ɒ', 'ɔː', 'ɐ', 'ʌ', 'ə', 'ʊ', 'uː', 'ɜː',
  'eɪ', 'aɪ', 'əʊ', 'aʊ', 'ɔɪ', 'ɪə', 'ɛə', 'ʊə',
])

export interface DictionaryInfo {
  ipa: string
  syllables: number
  /** Vị trí âm tiết mang dấu nhấn chính (từ 0). */
  stress: number
}

export function dictionaryInfo(pron: string | undefined): DictionaryInfo | null {
  if (!pron) return null
  let syllables = 0
  let stress = 0
  for (const t of pron.split(' ').filter(Boolean)) {
    if (!IPA_VOWELS.has(t.replace(/^[ˈˌ]/, ''))) continue
    if (t.startsWith('ˈ')) stress = syllables
    syllables++
  }
  return { ipa: `/${pron.replace(/ /g, '')}/`, syllables, stress }
}
