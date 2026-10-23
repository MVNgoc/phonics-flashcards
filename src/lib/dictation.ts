import type { Phoneme } from './types'
import { spellingKey } from './lookup'

/**
 * Trang Nghe: nghe một từ, gõ phân tích âm theo phonics + từ gốc + chỗ nhấn.
 *
 * Đáp án không soạn tay mà suy ra từ chính bảng âm của bạn: lấy phát âm giọng Anh
 * của từ (src/data/pronunciations.json, IPA), rồi cắt từ thành các cụm chữ sao cho
 * mỗi cụm là một trường hợp trong bảng và đọc đúng âm đó. Vd
 *   daughter + "d ˈɔː t ə"  →  d·augh·t·er  →  /d/or/./t/ur/
 * Sửa bảng ở /manage là đáp án đổi theo.
 */

/**
 * Âm IPA (không dấu nhấn) mà mỗi nhãn đại diện — cầu nối giữa nhãn tự do trong
 * data và phát âm trong từ điển. Khoá là nhãn y như trong data: đổi tên nhãn ở
 * /manage thì phải đổi ở đây, nhãn không có ở đây thì không bao giờ được chọn.
 */
export const LABEL_SOUNDS: Record<string, string[][]> = {
  '/a/': [['æ']],
  '/e/': [['ɛ']],
  '/i/': [['ɪ'], ['i']],
  '/o/': [['ɒ'], ['ɔː']],
  '/u/': [['ɐ']],
  '/ai/': [['eɪ']],
  '/ee/': [['iː'], ['i']],
  '/igh/': [['aɪ']],
  '/oa/': [['əʊ']],
  '/yoo/': [['j', 'uː'], ['j', 'ʊ'], ['j', 'ə']],
  'Short /oo/': [['ʊ']],
  'Long /oo/': [['uː']],
  '/oi/': [['ɔɪ']],
  '/ou/': [['aʊ']],
  '/ar/': [['ɑː']],
  '/or/': [['ɔː']],
  '/ur/': [['ɜː'], ['ə']],
  '/air/': [['ɛə']],
  '/eer/': [['ɪə']],
  '/oor/': [['ʊə'], ['ɔː']],
  '/yoor/': [['j', 'ʊə'], ['j', 'ɔː'], ['j', 'ə']],
  '/ul/': [['ə', 'l'], ['ɪ', 'l'], ['ʊ', 'l']],
  '/b/': [['b']],
  '/k/': [['k']],
  '/d/': [['d']],
  '/f/': [['f']],
  '/g/': [['g']],
  '/h/': [['h']],
  '/j/': [['dʒ']],
  '/l/': [['l']],
  '/m/': [['m']],
  '/n/': [['n']],
  '/ng/': [['ŋ'], ['ŋ', 'k'], ['ŋ', 'g']],
  '/p/': [['p']],
  '/r/': [['ɹ']],
  '/s/': [['s']],
  '/kw/': [['k', 'w']],
  '/t/': [['t']],
  '/v/': [['v']],
  '/w/': [['w']],
  '/ks/': [['k', 's']],
  '/gz/': [['g', 'z']],
  '/ksh/': [['k', 'ʃ']],
  '/gzh/': [['g', 'ʒ']],
  '/y/': [['j']],
  '/z/': [['z']],
  '/ch/': [['tʃ']],
  '/sh/': [['ʃ']],
  '/th/': [['θ'], ['ð']],
  '/zh/': [['ʒ']],
}

/** Cặp cách viết + nhãn đọc hẹp hơn mặc định của nhãn. Khoá: `cách viết|nhãn`. */
const SPELLING_SOUNDS: Record<string, string[][]> = {
  // o trong /o/ là o ngắn (hot); a trong /o/ là o dài (talk, wall)
  'o|/o/': [['ɒ']],
  'a|/o/': [['ɔː']],
  // heart
  'ea|/a/': [['ɑː']],
  // sphinx, jinx
  'nx|/ng/': [['ŋ', 'k', 's']],
}

const VOWEL_SOUNDS = new Set([
  'æ', 'ɑː', 'ɛ', 'ɪ', 'i', 'iː', 'ɒ', 'ɔː', 'ɐ', 'ə', 'ʊ', 'uː', 'ɜː',
  'eɪ', 'aɪ', 'əʊ', 'aʊ', 'ɔɪ', 'ɪə', 'ɛə', 'ʊə',
])
/** Nguyên âm không nhấn bị đọc lướt (schwa ə, ɪ, i, ʊ): ghi theo âm nghe được (`asHeard`), chấp nhận cả ghi theo chữ. */
const REDUCED_SOUNDS = new Set(['ə', 'ɪ', 'i', 'ʊ'])
/**
 * Âm lướt được ghi thành nhãn có âm ngắn của chính chữ đó: about → /a/, audacity
 * "ci" → /i/. Không ghi thành âm dài (/ai/, /ar/) dù chữ đó cũng có trong nhãn ấy.
 */
const SHORT_SOUNDS = new Set(['æ', 'ɛ', 'ɪ', 'ɒ', 'ɐ', 'ə'])

/** Phạt khi căn: đáp án là mọi cách cắt có tổng phạt nhỏ nhất. Chữ câm phạt nặng hơn âm lướt. */
const PENALTY_REDUCED = 1
const PENALTY_SILENT = 2
/** Giữ tối đa bấy nhiêu cách cắt cho mỗi trạng thái, tránh nổ tổ hợp. */
const MAX_PATHS = 8

/**
 * Cách gõ một âm trong phân tích: mặc định là phần giữa hai dấu / của nhãn ("/or/" →
 * "or"). Âm cần ghi rõ biến thể thì gõ theo bảng dưới.
 */
const LABEL_TOKENS: Record<string, string> = {
  'Short /oo/': 'oo (S)',
  'Long /oo/': 'oo (L)',
}
/** Nhãn gộp hai âm, biến thể tuỳ âm thật trong từ: think → th (UV), this → th (V). */
const SOUND_TOKENS: Record<string, Record<string, string>> = {
  '/th/': { θ: 'th (UV)', ð: 'th (V)' },
}

/** Mọi cách gõ của một nhãn. */
function labelTokens(label: string): string[] {
  const variants = SOUND_TOKENS[label]
  if (variants) return Object.values(variants)
  return [LABEL_TOKENS[label] ?? (/^\/[^/]+\/$/.test(label) ? label.slice(1, -1) : label)]
}

/** Cách gõ của nhãn khi đọc thành `sound` (âm đầu tiên nó khớp). */
function tokenFor(label: string, sound?: string): string {
  return (sound && SOUND_TOKENS[label]?.[sound]) || labelTokens(label)[0]
}

/** "oo (L)" → "oo(l)", "/d/" → "d": dạng so khớp của một âm khi gõ. */
export function labelKey(token: string): string {
  return token.toLowerCase().replace(/[/\s]/g, '')
}

/** Âm khi hiện trong chip: "or" → "/or/", biến thể có ngoặc giữ nguyên ("th (UV)"). */
export function tokenDisplay(token: string): string {
  return token.includes('(') ? token : `/${token}/`
}

export type Stress = 'primary' | 'secondary' | null

export interface Step {
  /** Cụm chữ tạo ra âm, vd "augh". Rỗng khi là /r/ nối (story → /or/./r/i/). */
  spelling: string
  label: string
  /** Cách gõ âm này: "or", "th (UV)", "oo (L)". */
  token: string
  /** Âm này là hạt nhân của một âm tiết (nguyên âm, hoặc /ul/). */
  nucleus: boolean
  stress: Stress
  /** Nguyên âm lướt không nhấn (schwa ə...): khó nghe ra chữ nào, phải đoán. */
  reduced: boolean
  /** Cách viết đầu tiên của âm trong bảng (cách viết cơ bản), vd "or" của /or/ — không phải "augh". */
  common: boolean
  /** Âm IPA thật (không dấu nhấn), vd ["ɔː"] — /o/ có thể là ɒ (hot) hay ɔː (talk). */
  sounds: string[]
}

export interface Answer {
  /** Cách gõ đã chuẩn hoá (xem `labelKey`), dùng để so với cái người dùng gõ. */
  tokens: string[]
  /** Cách cắt chữ ↔ âm. Đáp án người dùng tự thêm thì không có. */
  steps: Step[] | null
  syllables: Step[][]
  /** Số hạt nhân (≈ số âm tiết). */
  nuclei: number
  /** Thứ tự (từ 0) của hạt nhân được nhấn chính trong các hạt nhân; null = không biết. */
  stress: number | null
  /** Phải coi chữ ngoài bảng là chữ câm → máy đoán, có thể chưa khớp cách bạn phân tích. */
  guessed: boolean
  source: 'auto' | 'user'
}

export interface DictationItem {
  word: string
  answers: Answer[]
  /** Từ ví dụ trong bảng (true) hay từ thêm từ từ điển (false). */
  fromTable: boolean
  /** Điểm độ khó, xem `difficulty`. */
  difficulty: number
}


/** Các từ ví dụ một chữ trong data, viết thường, không trùng. Bỏ chú thích "(h câm): rhythm". */
export function exampleWords(phonemes: Phoneme[]): string[] {
  const words = new Set<string>()
  for (const p of phonemes) {
    for (const g of p.graphemes) {
      for (const ex of g.examples) {
        const w = cleanExample(ex)
        if (/^[a-z]+$/.test(w)) words.add(w)
      }
    }
  }
  return [...words]
}

interface Unit {
  /** Phần chữ đứng tại chỗ (với "a-e" là "a"). */
  head: string
  /** Phần đuôi của cách viết tách đôi ("e" của "a-e"). */
  tail: string | null
  /** Chữ hiển thị dưới âm. */
  spelling: string
  label: string
  vowel: boolean
  sounds: string[][]
  /** Chỉ dùng được khi ngay trước là chuỗi này (a sau w: water). */
  after?: string
  /** Từ ví dụ của trường hợp này trong bảng. */
  examples: Set<string>
  /** Cách viết đầu tiên của âm trong bảng. */
  common: boolean
}

/** "(h câm): rhythm" → "rhythm". */
function cleanExample(example: string): string {
  return example.split(':').pop()!.trim().toLowerCase()
}

/** Mọi cách viết trong bảng, quy về đơn vị căn được. */
function buildUnits(phonemes: Phoneme[]): Unit[] {
  const units: Unit[] = []
  const seen = new Set<string>()
  const push = (u: Unit) => {
    const id = `${u.head}-${u.tail}|${u.label}|${u.after ?? ''}`
    if (seen.has(id)) return
    seen.add(id)
    units.push(u)
  }

  for (const p of phonemes) {
    const label = p.note?.trim()
    if (!label) continue
    const vowel = p.type === 'vowel'
    p.graphemes.forEach((g, index) => {
      const key = spellingKey(g.spelling)
      if (!key) return
      const sounds = SPELLING_SOUNDS[`${key}|${label}`] ?? LABEL_SOUNDS[label]
      if (!sounds) return
      const examples = new Set(g.examples.map(cleanExample))
      const common = index === 0

      const split = /^([a-z]+)-([a-z]+)$/.exec(key)
      if (split) {
        push({ head: split[1], tail: split[2], spelling: key, label, vowel, sounds, examples, common })
        return
      }
      // "wa", "qua" ở /o/: chữ w / qu vẫn đọc thành âm của nó, chỉ a đọc thành /o/.
      const prefix = vowel ? /^(qu|w)(.+)$/.exec(key) : null
      if (prefix) {
        push({ head: prefix[2], tail: null, spelling: prefix[2], label, vowel, sounds, after: prefix[1], examples, common })
        return
      }
      // "ture" ở /ch/: tu đọc /ch/, re đọc /ur/ (nature, picture).
      if (key === 'ture') {
        push({ head: 'tu', tail: null, spelling: 'tu', label, vowel, sounds, examples, common })
        return
      }
      push({ head: key, tail: null, spelling: key, label, vowel, sounds, examples, common })

      // Phụ âm đôi chưa có trong bảng (cc, vv...) đọc như phụ âm đơn.
      if (!vowel && /^[bcdfgklmnprstvz]$/.test(key)) {
        push({ head: key + key, tail: null, spelling: key + key, label, vowel, sounds, examples, common: false })
      }
    })
  }
  return units
}

interface Sound {
  base: string
  stress: Stress
}

function parsePron(pron: string): Sound[] {
  return pron
    .split(' ')
    .filter(Boolean)
    .map((t) => ({
      base: t.replace(/^[ˈˌ]/, ''),
      stress: t.startsWith('ˈ') ? 'primary' : t.startsWith('ˌ') ? 'secondary' : null,
    }))
}

/** Bước không đọc thành âm nào trong bảng: chữ câm, hoặc /r/ nối (điền label/token sau). */
const BLANK_STEP: Step = {
  spelling: '',
  label: '',
  token: '',
  nucleus: false,
  stress: null,
  reduced: false,
  common: true,
  sounds: [],
}

interface RawStep extends Step {
  silent?: boolean
  /** Từ đang căn có trong ví dụ của trường hợp này: cách cắt khớp với bảng. */
  listed?: boolean
}

interface Paths {
  penalty: number
  paths: RawStep[][]
}

/**
 * Mọi cách cắt `word` thành các cách viết trong bảng sao cho đọc ra đúng `pron`,
 * chỉ giữ những cách có tổng phạt nhỏ nhất. Không cắt được → [].
 *
 * `trustTable`: cho phép một cách viết có từ này trong ví dụ đọc thành nguyên âm
 * bất kỳ — chỉ dùng khi căn bình thường thất bại.
 */
function alignWord(word: string, pron: string, units: Unit[], rLabel: string, trustTable: boolean): Paths {
  const w = word.toLowerCase()
  const sounds = parsePron(pron)
  const memo = new Map<string, Paths | null>()

  const go = (i: number, j: number, pend: string | null): Paths | null => {
    const key = `${i},${j},${pend ?? ''}`
    const cached = memo.get(key)
    if (cached !== undefined) return cached

    let best: Paths | null = null
    const offer = (rest: Paths | null, add: number, steps: RawStep[]) => {
      if (!rest) return
      const penalty = rest.penalty + add
      if (best && penalty > best.penalty) return
      const paths = rest.paths.map((p) => [...steps, ...p])
      if (!best || penalty < best.penalty) best = { penalty, paths: paths.slice(0, MAX_PATHS) }
      else best.paths = [...best.paths, ...paths].slice(0, MAX_PATHS)
    }

    if (i === w.length && j === sounds.length && !pend) {
      memo.set(key, { penalty: 0, paths: [[]] })
      return memo.get(key)!
    }

    // Đuôi của cách viết tách đôi (e của a-e): không đọc thành âm nào.
    if (pend && w.startsWith(pend, i)) offer(go(i + pend.length, j, null), 0, [])

    // Chữ câm ngoài bảng (l trong talk, e cuối từ...).
    if (i < w.length) {
      offer(go(i + 1, j, pend), PENALTY_SILENT, [
        { ...BLANK_STEP, spelling: w[i], silent: true },
      ])
    }

    for (const u of units) {
      if (!w.startsWith(u.head, i)) continue
      if (u.after && !w.slice(0, i).endsWith(u.after)) continue
      // Đang chờ đuôi e của a-e thì không được có nguyên âm khác chen vào.
      if (pend && (u.vowel || u.tail)) continue
      const next = i + u.head.length
      const nextPend = u.tail ?? pend
      let exact = false

      for (const seq of u.sounds) {
        if (!seq.every((s, k) => sounds[j + k]?.base === s)) continue
        // /ul/ (ơ + l) chỉ ở cuối âm tiết: table, april — không phải "del" trong delicious.
        if (seq.length > 1 && seq[seq.length - 1] === 'l' && VOWEL_SOUNDS.has(sounds[j + seq.length]?.base ?? '')) continue
        if (seq.length === 1) exact = true
        const matched = sounds.slice(j, j + seq.length)
        const step: RawStep = {
          spelling: u.spelling,
          label: u.label,
          token: tokenFor(u.label, seq[0]),
          nucleus: seq.some((s) => VOWEL_SOUNDS.has(s)),
          stress: matched.find((s) => s.stress)?.stress ?? null,
          reduced: matched.some((s) => !s.stress && REDUCED_SOUNDS.has(s.base)),
          common: u.common,
          sounds: seq,
          listed: u.examples.has(w),
        }
        const after = j + seq.length
        offer(go(next, after, nextPend), 0, [step])
        // Cách viết có r (or, er...) trước một nguyên âm: r vẫn đọc (story). Chấp
        // nhận cả hai kiểu: r nhập vào âm trước, hoặc tách thành /r/ riêng.
        if (u.vowel && u.head.includes('r') && sounds[after]?.base === 'ɹ') {
          offer(go(next, after + 1, nextPend), 0, [step])
          offer(go(next, after + 1, nextPend), 0, [
            step,
            { ...BLANK_STEP, label: rLabel, token: tokenFor(rLabel), sounds: ['ɹ'] },
          ])
        }
      }

      const s = sounds[j]
      if (!u.vowel || exact || !s || !VOWEL_SOUNDS.has(s.base)) continue
      const listed = u.examples.has(w)
      // Bảng ghi từ này là ví dụ của trường hợp này (because ở au của /or/) thì
      // tin bảng, dù từ điển đọc khác.
      if (listed && trustTable) {
        offer(go(next, j + 1, nextPend), 0, [
          {
            spelling: u.spelling,
            label: u.label,
            token: tokenFor(u.label),
            nucleus: true,
            stress: s.stress,
            reduced: !s.stress && REDUCED_SOUNDS.has(s.base),
            common: u.common,
            sounds: [s.base],
            listed,
          },
        ])
        continue
      }
      // Nguyên âm lướt không nhấn: ghi theo âm ngắn của chữ viết.
      const short = u.sounds.some((seq) => seq.length === 1 && SHORT_SOUNDS.has(seq[0]))
      if (short && !s.stress && REDUCED_SOUNDS.has(s.base)) {
        offer(go(next, j + 1, nextPend), PENALTY_REDUCED, [
          {
            spelling: u.spelling,
            label: u.label,
            token: tokenFor(u.label),
            nucleus: true,
            stress: null,
            reduced: true,
            common: u.common,
            sounds: [s.base],
            listed,
          },
        ])
      }
    }

    memo.set(key, best)
    return best
  }

  return go(0, 0, null) ?? { penalty: 0, paths: [] }
}

/**
 * Cách cắt nên hiện trước: ít chữ câm, dùng đúng trường hợp có từ này làm ví dụ
 * trong bảng (heart → ea của /a/), ít cụm (cụm dài như "ei" hơn "e" + "i"), ít
 * cách viết tách đôi.
 */
function pathRank(path: RawStep[]): number {
  const silent = path.filter((s) => s.silent).length
  const listed = path.filter((s) => s.listed).length
  const split = path.filter((s) => s.spelling.includes('-')).length
  return silent * 100 - listed * 10 + path.length + split
}

/** Gộp chữ câm vào cụm đứng trước (đầu từ thì vào cụm đứng sau). */
function mergeSilent(path: RawStep[]): Step[] {
  const out: Step[] = []
  let carry = ''
  for (const s of path) {
    if (s.silent) {
      if (out.length) out[out.length - 1] = { ...out[out.length - 1], spelling: out[out.length - 1].spelling + s.spelling }
      else carry += s.spelling
      continue
    }
    out.push({
      spelling: carry + s.spelling,
      label: s.label,
      token: s.token,
      nucleus: s.nucleus,
      stress: s.stress,
      reduced: s.reduced,
      common: s.common,
      sounds: s.sounds,
    })
    carry = ''
  }
  return out
}

/** Cặp phụ âm đứng đầu âm tiết được (pl, str...): dồn cả cặp sang âm tiết sau. */
const ONSETS = new Set([
  'pl', 'pr', 'bl', 'br', 'kl', 'kr', 'gl', 'gr', 'fl', 'fr', 'tr', 'dr', 'th(uv)r', 'shr',
  'sp', 'st', 'sk', 'sm', 'sn', 'sl', 'sw', 'tw', 'dw',
])

/**
 * Chia âm tiết: mỗi âm tiết một hạt nhân. Phụ âm giữa hai hạt nhân: một → sang âm
 * tiết sau; nhiều → cặp cuối sang sau nếu đứng đầu âm tiết được, không thì chỉ
 * phụ âm cuối. Ranh giới âm tiết vốn không có đáp án duy nhất nên không chấm.
 */
export function syllabify<T extends { nucleus: boolean }>(steps: T[], keyOf: (s: T) => string): T[][] {
  const nuclei = steps.map((s, k) => (s.nucleus ? k : -1)).filter((k) => k >= 0)
  if (nuclei.length <= 1) return [steps]
  const cuts: number[] = []
  for (let n = 0; n < nuclei.length - 1; n++) {
    const a = nuclei[n]
    const b = nuclei[n + 1]
    const between = b - a - 1
    if (between <= 1) cuts.push(a + 1)
    else {
      const pair = keyOf(steps[b - 2]) + keyOf(steps[b - 1])
      cuts.push(ONSETS.has(pair) ? b - 2 : b - 1)
    }
  }
  const out: T[][] = []
  let prev = 0
  for (const c of [...cuts, steps.length]) {
    out.push(steps.slice(prev, c))
    prev = c
  }
  return out
}

const stepKey = (s: Step) => labelKey(s.token)

function answerFromSteps(steps: Step[], guessed: boolean): Answer {
  const nuclei = steps.filter((s) => s.nucleus)
  const primary = nuclei.findIndex((s) => s.stress === 'primary')
  return {
    tokens: steps.map(stepKey),
    steps,
    syllables: syllabify(steps, stepKey),
    nuclei: nuclei.length,
    stress: primary >= 0 ? primary : nuclei.length === 1 ? 0 : null,
    guessed,
    source: 'auto',
  }
}

/** Nhãn nào là hạt nhân âm tiết: nguyên âm trong bảng, hoặc nhãn có chứa nguyên âm (/ul/). */
export function nucleusKeys(phonemes: Phoneme[]): Set<string> {
  const keys = new Set<string>()
  for (const p of phonemes) {
    const label = p.note?.trim()
    if (!label) continue
    if (p.type === 'vowel' || LABEL_SOUNDS[label]?.some((seq) => seq.some((s) => VOWEL_SOUNDS.has(s)))) {
      for (const token of labelTokens(label)) keys.add(labelKey(token))
    }
  }
  return keys
}

/** Mọi cách gõ hợp lệ theo bảng, dạng chuẩn hoá → dạng hiển thị: "oo(l)" → "oo (L)". */
export function tokensByKey(phonemes: Phoneme[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const p of phonemes) {
    const label = p.note?.trim()
    if (label) for (const token of labelTokens(label)) map.set(labelKey(token), token)
  }
  return map
}

/** Âm tiết (từ 0) chứa hạt nhân được nhấn; null nếu không biết hoặc chỉ có một âm tiết. */
export function stressedSyllable(answer: Answer): number | null {
  if (answer.stress === null || answer.nuclei <= 1) return null
  let seen = 0
  for (let k = 0; k < answer.syllables.length; k++) {
    seen += answer.syllables[k].filter((s) => s.nucleus).length
    if (seen > answer.stress) return k
  }
  return null
}

/**
 * Viết đáp án thành chuỗi kiểu người dùng gõ: "'/d/or/./t/ur/". Đáp án người dùng
 * tự thêm không có âm tiết → viết liền, đổi dạng chuẩn hoá về dạng hiển thị qua `tokens`.
 */
export function formatAnswer(answer: Answer, tokens?: Map<string, string>): string {
  if (!answer.steps) {
    return '/' + answer.tokens.map((t) => tokens?.get(t) ?? t).join('/') + '/'
  }
  const stressed = stressedSyllable(answer)
  return answer.syllables
    .map((syl, k) => (k === stressed ? "'" : '') + '/' + syl.map((s) => s.token).join('/') + '/')
    .join('.')
}

export interface BuildResult {
  items: DictationItem[]
  /** Từ ví dụ chưa luyện được: thiếu phát âm, hoặc bảng không cắt ra được. */
  unresolved: { word: string; reason: 'no-pron' | 'no-align' }[]
}

/** Mọi đáp án máy suy ra cho một từ; [] nếu không cắt được. */
/**
 * Âm lướt không nhấn ghi theo âm nghe được → nhãn nào. Schwa ə ghi /u/; ɪ, i ghi
 * /i/; ʊ ghi oo (S). Khoá là âm, giá trị là âm "chuẩn" để tìm nhãn trong bảng.
 */
const HEARD_AS: Record<string, string> = { ə: 'ɐ', ɪ: 'ɪ', i: 'ɪ', ʊ: 'ʊ' }

/**
 * Cách ghi chính của nguyên âm lướt: ghi theo âm nghe được, không theo chữ viết —
 * about → /u/.'/b/ou/t/, delicious → /d/i/.'/l/i/./sh/u/s/. Cách ghi theo chữ
 * (/a/, /e/, /o/...) vẫn là đáp án được chấp nhận. Nhãn nào trong bảng vốn đã đọc
 * đúng âm đó thì giữ: schwa viết có r → /ur/ (doctor), honey → /ee/, /ul/ nguyên.
 */
function asHeard(steps: Step[], heardLabels: Map<string, string>): Step[] {
  return steps.map((s) => {
    if (!s.nucleus || !s.reduced || s.sounds.length !== 1) return s
    const sound = s.sounds[0]
    const label = heardLabels.get(sound)
    if (!label || LABEL_SOUNDS[s.label]?.some((seq) => seq.length === 1 && seq[0] === sound)) return s
    return { ...s, label, token: tokenFor(label) }
  })
}

function autoAnswers(
  word: string,
  list: string[],
  units: Unit[],
  rLabel: string,
  heardLabels: Map<string, string>,
): Answer[] {
  const found: Answer[] = []
  for (const trustTable of [false, true]) {
    for (const pron of list) {
      const { paths } = alignWord(word, pron, units, rLabel, trustTable)
      const ranked = [...paths].sort((a, b) => pathRank(a) - pathRank(b))
      for (const path of ranked) found.push(answerFromSteps(mergeSilent(path), path.some((s) => s.silent)))
    }
    if (found.length) break
  }
  // Ghi theo âm nghe được lên trước, rồi tới cách ghi theo chữ.
  const all = [...found.map((a) => answerFromSteps(asHeard(a.steps!, heardLabels), a.guessed)), ...found]
  const seen = new Set<string>()
  return all.filter((a) => {
    const id = a.tokens.join(' ')
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * Điểm độ khó của một từ, theo đáp án đầu tiên: nhiều âm tiết, nhiều âm, nhiều âm
 * schwa (phải đoán chữ), nhiều cách viết không cơ bản (augh thay vì or), có chữ câm.
 */
export function difficulty(answer: Answer): number {
  const steps = answer.steps ?? []
  const reduced = steps.filter((s) => s.reduced).length
  const rare = steps.filter((s) => s.spelling && !s.common).length
  return answer.nuclei * 1.5 + answer.tokens.length * 0.4 + reduced * 1.5 + rare + (answer.guessed ? 1 : 0)
}

/**
 * Dựng bộ từ luyện nghe (chưa gồm đáp án người dùng thêm, xem `withExtraAnswers`):
 * - mọi từ ví dụ trong bảng; từ nào không luyện được thì vào `unresolved`;
 * - cộng `practiceWords` (từ điển, src/data/practiceWords.json) — chỉ lấy từ cắt được
 *   gọn bằng bảng, không phải đoán chữ câm; từ trượt thì bỏ qua lặng lẽ.
 */
export function alignItems(
  phonemes: Phoneme[],
  prons: Record<string, string[]>,
  practiceWords: string[] = [],
): BuildResult {
  const units = buildUnits(phonemes)
  const labelFor = (sound: string) =>
    phonemes.find((p) => p.note && LABEL_SOUNDS[p.note.trim()]?.[0]?.[0] === sound)?.note?.trim()
  const rLabel = labelFor('ɹ') ?? '/r/'
  const heardLabels = new Map<string, string>()
  for (const [sound, base] of Object.entries(HEARD_AS)) {
    const label = labelFor(base)
    if (label) heardLabels.set(sound, label)
  }
  const result: BuildResult = { items: [], unresolved: [] }
  const tableWords = exampleWords(phonemes)

  for (const word of tableWords) {
    const list = prons[word]
    if (!list?.length) {
      result.unresolved.push({ word, reason: 'no-pron' })
      continue
    }
    const answers = autoAnswers(word, list, units, rLabel, heardLabels)
    if (!answers.length) result.unresolved.push({ word, reason: 'no-align' })
    else result.items.push({ word, answers, fromTable: true, difficulty: difficulty(answers[0]) })
  }

  const taken = new Set(tableWords)
  for (const word of practiceWords) {
    const list = prons[word]
    if (taken.has(word) || !list?.length) continue
    taken.add(word)
    const answers = autoAnswers(word, list, units, rLabel, heardLabels)
    if (!answers.length || answers[0].guessed) continue
    result.items.push({ word, answers, fromTable: false, difficulty: difficulty(answers[0]) })
  }
  return result
}

/** Gắn đáp án người dùng tự thêm vào bộ từ. Tách riêng để thêm đáp án không phải căn lại cả bộ. */
export function withExtraAnswers(
  result: BuildResult,
  extra: Record<string, string[]>,
  phonemes: Phoneme[],
): BuildResult {
  const nuclei = nucleusKeys(phonemes)
  const items = result.items.map((item) => {
    const texts = extra[item.word]
    if (!texts?.length) return item
    const answers = [...item.answers]
    const seen = new Set(answers.map((a) => a.tokens.join(' ')))
    for (const text of texts) {
      const parsed = parseBreakdown(text, nuclei)
      const id = parsed.tokens.join(' ')
      if (!parsed.tokens.length || seen.has(id)) continue
      seen.add(id)
      answers.push({
        tokens: parsed.tokens,
        steps: null,
        syllables: [],
        nuclei: parsed.tokens.filter((t) => nuclei.has(t)).length,
        stress: answers[0].stress,
        guessed: false,
        source: 'user',
      })
    }
    return { ...item, answers }
  })
  return { ...result, items }
}

/** Dựng bộ từ luyện nghe + đáp án người dùng tự thêm. */
export function buildItems(
  phonemes: Phoneme[],
  prons: Record<string, string[]>,
  extra: Record<string, string[]> = {},
  practiceWords: string[] = [],
): BuildResult {
  return withExtraAnswers(alignItems(phonemes, prons, practiceWords), extra, phonemes)
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Thứ tự từ cho một phiên, trộn đều độ khó: xếp theo `difficulty`, chia ba phần
 * bằng nhau (dễ / vừa / khó), xáo từng phần rồi lấy xen kẽ dễ – vừa – khó. Nên
 * học vài chục từ đầu đã gặp đủ ba mức.
 */
export function mixedQueue(items: DictationItem[], rng: () => number = Math.random): string[] {
  const sorted = [...items].sort((a, b) => a.difficulty - b.difficulty)
  const third = Math.ceil(sorted.length / 3)
  const levels = [0, 1, 2].map((k) => shuffled(sorted.slice(k * third, (k + 1) * third), rng))
  const out: string[] = []
  for (let i = 0; i < third; i++) {
    for (const level of shuffled(levels, rng)) if (level[i]) out.push(level[i].word)
  }
  return out
}

export interface ParsedInput {
  tokens: string[]
  /** Các âm tiết theo dấu chấm người dùng gõ. */
  syllables: string[][]
  /** Thứ tự hạt nhân đứng ngay sau dấu nhấn ', null = chưa đánh dấu. */
  stress: number | null
}

/**
 * Đọc phân tích người dùng gõ. Âm cách nhau bằng "/" hoặc dấu cách, "." ngăn âm
 * tiết, "'" (hoặc ˈ) đặt trước âm tiết được nhấn:
 *   /o/.'/d/a/s/./i/t/./i/   =   o . 'd a s . i t . i
 * Biến thể gõ trong ngoặc: oo (L), oo (S), th (UV), th (V) — có hay không có dấu
 * cách trước ngoặc đều được ("short oo" / "long oo" cũng nhận). Không phân biệt
 * hoa thường.
 */
export function parseBreakdown(text: string, nuclei: Set<string>): ParsedInput {
  const norm = text
    .toLowerCase()
    .replace(/ˈ/g, "'")
    .replace(/(short|long)[\s/]*oo/g, (_, kind: string) => (kind === 'short' ? 'oo(s)' : 'oo(l)'))
    .replace(/\s*\(\s*([a-z]+)\s*\)/g, '($1)')
  const parts = norm.match(/'|\.|[^\s/.']+/g) ?? []
  const parsed: ParsedInput = { tokens: [], syllables: [[]], stress: null }
  let nucleusCount = 0
  for (const part of parts) {
    if (part === "'") {
      parsed.stress ??= nucleusCount
    } else if (part === '.') {
      if (parsed.syllables[parsed.syllables.length - 1].length) parsed.syllables.push([])
    } else {
      parsed.tokens.push(part)
      parsed.syllables[parsed.syllables.length - 1].push(part)
      if (nuclei.has(part)) nucleusCount++
    }
  }
  if (!parsed.syllables[parsed.syllables.length - 1].length) parsed.syllables.pop()
  return parsed
}

/** Dạng lưu của một phân tích: nhãn chuẩn hoá cách nhau bằng dấu cách. */
export function serializeTokens(tokens: string[]): string {
  return tokens.join(' ')
}

/** Đánh dấu phần chung dài nhất (LCS) giữa hai dãy: true = khớp. */
export function diffTokens(a: string[], b: string[]): { a: boolean[]; b: boolean[]; distance: number } {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ma = new Array<boolean>(a.length).fill(false)
  const mb = new Array<boolean>(b.length).fill(false)
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ma[i++] = true
      mb[j++] = true
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return { a: ma, b: mb, distance: a.length + b.length - 2 * dp[0][0] }
}

export interface DictationGrade {
  sounds: boolean
  stress: boolean
  word: boolean
  /** Đáp án khớp, hoặc gần nhất với cái người dùng gõ. */
  answer: Answer
  /** Từng âm người dùng gõ có nằm trong phần khớp với đáp án không. */
  inputMarks: boolean[]
  answerMarks: boolean[]
}

export function gradeDictation(item: DictationItem, input: ParsedInput, typedWord: string): DictationGrade {
  let best = item.answers[0]
  let bestDiff = diffTokens(input.tokens, best.tokens)
  for (const answer of item.answers.slice(1)) {
    const d = diffTokens(input.tokens, answer.tokens)
    if (d.distance < bestDiff.distance) {
      best = answer
      bestDiff = d
    }
  }
  return {
    sounds: bestDiff.distance === 0,
    // Từ một âm tiết thì không cần đánh dấu nhấn.
    stress: best.stress === null || best.nuclei <= 1 || input.stress === best.stress,
    word: typedWord.trim().toLowerCase() === item.word,
    answer: best,
    inputMarks: bestDiff.a,
    answerMarks: bestDiff.b,
  }
}
