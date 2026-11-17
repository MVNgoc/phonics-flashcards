import type { RuleQuizStat } from './types'

/**
 * 14 quy tắc "Shades of sounds": khi nào chữ đọc dài / ngắn / câm / đổi âm.
 *
 * Mỗi quy tắc có:
 *  - nội dung + ví dụ soạn tay (trang Quy tắc → Đọc),
 *  - một hoặc vài thẻ thuộc lòng "tình huống → kết quả" (→ Thuộc lòng, chấm SM-2),
 *  - một hàm nhận diện chạy trên mặt chữ + phát âm IPA giọng Anh của từ
 *    (src/data/pronunciations.json) để sinh câu hỏi Áp dụng và tìm ngoại lệ.
 *
 * Hàm nhận diện chỉ nhận những từ mà vị trí chữ ↔ âm suy ra chắc chắn được (vd chỉ
 * một chữ c trong từ). Từ đọc đúng quy tắc thành câu hỏi; từ đọc khác thì ghi là
 * ngoại lệ, không bao giờ thành câu hỏi để khỏi chấm sai người học theo quy tắc.
 */

export interface RuleCard {
  id: string
  /** Mặt trước: tình huống. */
  cue: string
  /** Mặt sau: kết quả. */
  result: string
  examples: string[]
}

export interface SoundRule {
  id: number
  title: string
  text: string
  examples: string[]
  /** Chú thích thêm (cách hiểu, ngoại lệ hay gặp). */
  note?: string
  cards: RuleCard[]
}

export const SOUND_RULES: SoundRule[] = [
  {
    id: 1,
    title: 'Nguyên âm đứng cuối → dài',
    text: 'Nguyên âm (a, e, i, o, u) đứng cuối âm tiết thì đọc dài, tức đọc như tên chữ cái.',
    examples: ['go', 'me', 'hi', 'pa·per', 'ti·ger', 'mu·sic'],
    note: 'a → /ai/, e → /ee/, i → /igh/, o → /oa/, u → /yoo/ hoặc Long /oo/.',
    cards: [
      {
        id: 'r1',
        cue: 'Nguyên âm đứng cuối (âm tiết)',
        result: 'Đọc dài, như tên chữ cái',
        examples: ['go', 'me', 'pa·per', 'ti·ger'],
      },
    ],
  },
  {
    id: 2,
    title: 'Nguyên âm không đứng cuối → giữ nguyên',
    text: 'Nguyên âm không đứng cuối (sau nó còn phụ âm trong cùng âm tiết) thì giữ nguyên âm ngắn.',
    examples: ['cat', 'bed', 'sit', 'hot', 'cup'],
    note: 'a → /a/, e → /e/, i → /i/, o → /o/, u → /u/. Ngoại lệ hay gặp: find, kind, old, most, both.',
    cards: [
      {
        id: 'r2',
        cue: 'Nguyên âm không đứng cuối (phụ âm đứng sau)',
        result: 'Giữ nguyên âm ngắn',
        examples: ['cat', 'bed', 'sit', 'hot', 'cup'],
      },
    ],
  },
  {
    id: 3,
    title: '2 nguyên âm → trước dài, sau câm',
    text: 'Hai nguyên âm (a, e, i, o, u) đứng cạnh nhau: nguyên âm đầu đọc dài (như tên chữ), nguyên âm sau câm.',
    examples: ['rain', 'team', 'see', 'boat', 'pie', 'blue'],
    note: 'Nhiều ngoại lệ với ea: bread, head, great.',
    cards: [
      {
        id: 'r3',
        cue: '2 nguyên âm đứng cạnh nhau',
        result: 'Nguyên âm trước đọc dài, nguyên âm sau câm',
        examples: ['rain', 'team', 'boat', 'pie'],
      },
    ],
  },
  {
    id: 4,
    title: '2 phụ âm → đọc trước, bỏ sau',
    text: 'Hai phụ âm giống nhau đứng liền (bb, ll, ss, tt…) chỉ đọc một lần: đọc chữ trước, bỏ chữ sau.',
    examples: ['happy', 'bell', 'kiss', 'letter', 'rabbit'],
    cards: [
      {
        id: 'r4',
        cue: '2 phụ âm giống nhau đứng liền (ll, ss, tt…)',
        result: 'Đọc chữ trước, bỏ chữ sau (chỉ đọc 1 lần)',
        examples: ['bell', 'kiss', 'letter'],
      },
    ],
  },
  {
    id: 5,
    title: 't trước ch → /ch/, t câm',
    text: 't đứng trước ch thì đọc /ch/, t câm.',
    examples: ['watch', 'catch', 'kitchen', 'match'],
    cards: [
      { id: 'r5', cue: 't đứng trước ch', result: 'Đọc /ch/, t câm', examples: ['watch', 'kitchen'] },
    ],
  },
  {
    id: 6,
    title: 'n trước /g/, /k/ → /ng/',
    text:
      'n đứng trước /g/ hoặc /k/ thì đọc /ng/. Trường hợp /ng/./g/ xuất hiện khi: -ng- đứng giữa từ, từ đó là từ gốc, và g đứng trước a, o, u hoặc phụ âm (g → /g/).',
    examples: ['sing', 'think', 'uncle', 'hungry', 'angry', 'single', 'language'],
    note: 'Không đủ điều kiện thì chỉ đọc /ng/: ng cuối từ (sing, long), g đứng trước e, i, y (singer, singing), có hậu tố (kings, strongly).',
    cards: [
      {
        id: 'r6a',
        cue: 'n đứng trước /g/ hoặc /k/',
        result: 'n đọc /ng/',
        examples: ['sing', 'think', 'uncle', 'bank'],
      },
      {
        id: 'r6b',
        cue: '-ng- đứng giữa từ gốc, g đứng trước a, o, u hoặc phụ âm',
        result: 'Đọc /ng/./g/ (g → /g/)',
        examples: ['hungry', 'angry', 'single', 'language'],
      },
    ],
  },
  {
    id: 7,
    title: 'kn đầu từ → k câm',
    text: 'k đứng đầu từ và đứng trước n thì k câm.',
    examples: ['know', 'knife', 'knee', 'knock'],
    cards: [{ id: 'r7', cue: 'k đứng đầu từ, trước n', result: 'k câm', examples: ['know', 'knife', 'knee'] }],
  },
  {
    id: 8,
    title: 'wr đầu từ → w câm',
    text: 'w đứng đầu từ và đứng trước r thì w câm.',
    examples: ['write', 'wrong', 'wrap', 'wrist'],
    cards: [{ id: 'r8', cue: 'w đứng đầu từ, trước r', result: 'w câm', examples: ['write', 'wrong', 'wrap'] }],
  },
  {
    id: 9,
    title: 'gn đầu từ → g câm',
    text: 'g đứng đầu từ và đứng trước n thì g câm.',
    examples: ['gnome', 'gnaw', 'gnat'],
    cards: [{ id: 'r9', cue: 'g đứng đầu từ, trước n', result: 'g câm', examples: ['gnome', 'gnaw'] }],
  },
  {
    id: 10,
    title: 'c mềm /s/, c cứng /k/',
    text: 'c đứng trước e, i, y đọc /s/. c đứng trước a, o, u, phụ âm, hoặc đứng cuối từ đọc /k/.',
    examples: ['city', 'cent', 'cycle', 'cat', 'cold', 'cup', 'class', 'music'],
    cards: [
      { id: 'r10a', cue: 'c đứng trước e, i, y', result: 'c đọc /s/', examples: ['city', 'cent', 'cycle'] },
      {
        id: 'r10b',
        cue: 'c đứng trước a, o, u, phụ âm, hoặc đứng cuối từ',
        result: 'c đọc /k/',
        examples: ['cat', 'cold', 'class', 'music'],
      },
    ],
  },
  {
    id: 11,
    title: 'g mềm /j/, g cứng /g/',
    text: 'g đứng trước e, i, y đọc /j/. g đứng trước a, o, u hoặc phụ âm đọc /g/.',
    examples: ['gem', 'giant', 'gym', 'gas', 'go', 'gum', 'glad'],
    note: 'Nhiều ngoại lệ g + e/i vẫn đọc /g/: get, give, girl, begin.',
    cards: [
      { id: 'r11a', cue: 'g đứng trước e, i, y', result: 'g đọc /j/', examples: ['gem', 'giant', 'gym'] },
      {
        id: 'r11b',
        cue: 'g đứng trước a, o, u hoặc phụ âm',
        result: 'g đọc /g/',
        examples: ['gas', 'go', 'gum', 'glad'],
      },
    ],
  },
  {
    id: 12,
    title: 'igh → /igh/',
    text: 'i đứng trước gh: i đọc dài (/igh/), gh câm.',
    examples: ['night', 'high', 'light', 'right'],
    cards: [
      { id: 'r12', cue: 'i đứng trước gh', result: 'i đọc dài /igh/, gh câm', examples: ['night', 'high', 'light'] },
    ],
  },
  {
    id: 13,
    title: 'y cuối từ 2 âm tiết → /i/',
    text: 'y đứng cuối một từ có 2 âm tiết và nhấn âm đầu thì y đọc /i/.',
    examples: ['happy', 'baby', 'city', 'funny'],
    cards: [
      {
        id: 'r13',
        cue: 'y đứng cuối từ 2 âm tiết, nhấn âm đầu',
        result: 'y đọc /i/',
        examples: ['happy', 'baby', 'city'],
      },
    ],
  },
  {
    id: 14,
    title: 'e cuối từ 2+ âm tiết → câm',
    text: 'e đứng cuối một từ có từ 2 âm tiết trở lên thì thường câm.',
    examples: ['promise', 'engine', 'picture', 'welcome'],
    note: 'Ngoại lệ là từ mượn: recipe, karate, apostrophe.',
    cards: [
      {
        id: 'r14',
        cue: 'e đứng cuối từ có 2 âm tiết trở lên',
        result: 'e thường câm',
        examples: ['promise', 'engine', 'picture'],
      },
    ],
  },
]

export const RULE_CARDS: (RuleCard & { ruleId: number })[] = SOUND_RULES.flatMap((r) =>
  r.cards.map((c) => ({ ...c, ruleId: r.id })),
)

export function ruleById(id: number): SoundRule | undefined {
  return SOUND_RULES.find((r) => r.id === id)
}

// ---------- câu hỏi Áp dụng ----------

/** Các cách đọc có thể chọn khi trả lời. */
export type Outcome =
  | 'long'
  | 'short'
  | 'silent'
  | 'sounded'
  | 's'
  | 'k'
  | 'j'
  | 'g'
  | 'n'
  | 'ng'
  | 'ngg'
  | 'i'
  | 'igh'

export const OUTCOME_LABEL: Record<Outcome, string> = {
  long: 'Dài (như tên chữ)',
  short: 'Giữ nguyên (ngắn)',
  silent: 'Câm',
  sounded: 'Có đọc',
  s: '/s/',
  k: '/k/',
  j: '/j/',
  g: '/g/',
  n: '/n/',
  ng: '/ng/',
  ngg: '/ng/ + /g/',
  i: '/i/',
  igh: '/igh/',
}

export interface RuleQuestion {
  ruleId: number
  word: string
  /** Chữ được hỏi: [đầu, cuối) trong từ. */
  start: number
  end: number
  options: Outcome[]
  answer: Outcome
  /** Cả cụm chữ của quy tắc (ay, kn, ll, igh, ce…), tô sau khi trả lời. Không có = chỉ chữ được hỏi. */
  cluster?: [number, number]
}

export interface RuleException {
  ruleId: number
  word: string
  start: number
  end: number
  /** Quy tắc đoán đọc thế này… */
  expected: Outcome
  /** …nhưng từ điển đọc khác, mô tả ngắn. */
  actual: string
}

interface Sound {
  base: string
  stress: 'primary' | 'secondary' | null
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

const VOWEL_SOUNDS = new Set([
  'æ', 'ɑː', 'ɛ', 'ɪ', 'i', 'iː', 'ɒ', 'ɔː', 'ɐ', 'ʌ', 'ə', 'ʊ', 'uː', 'ɜː',
  'eɪ', 'aɪ', 'əʊ', 'aʊ', 'ɔɪ', 'ɪə', 'ɛə', 'ʊə',
])
const isVowelSound = (s: Sound | undefined) => !!s && VOWEL_SOUNDS.has(s.base)

/** Âm dài (tên chữ) và âm ngắn của từng chữ nguyên âm. */
const LONG: Record<string, string[]> = { a: ['eɪ'], e: ['iː'], i: ['aɪ'], o: ['əʊ'], u: ['uː'] }
const SHORT: Record<string, string[]> = { a: ['æ'], e: ['ɛ'], i: ['ɪ'], o: ['ɒ'], u: ['ɐ', 'ʌ', 'ʊ'] }

/** Ghi IPA cho người đọc: bỏ khoảng trắng giữa các âm. */
export function showPron(pron: string): string {
  return `/${pron.replace(/ /g, '')}/`
}

const count = (sounds: Sound[], base: string) => sounds.filter((s) => s.base === base).length
const countText = (word: string, re: RegExp) => (word.match(re) ?? []).length

type Push = (q: Omit<RuleQuestion, 'ruleId'>) => void
type PushEx = (e: Omit<RuleException, 'ruleId'>) => void
type Detector = (word: string, sounds: Sound[], push: Push, pushEx: PushEx) => void

const LONG_SHORT: Outcome[] = ['long', 'short']

/** Chữ khác trong từ cũng có thể tạo ra âm này (access: cc → /ks/) — khi đó đếm âm không kết luận được. */
const OTHER_SOURCES: Record<string, RegExp> = {
s: /c|x|z/,
z: /s/,
t: /ed$|ch/,
d: /ed$/,
f: /ph|gh/,
g: /x/,
}

/** Phần sau ng là hậu tố (kings, strongly, kingdom): từ không phải từ gốc. */
const NG_SUFFIX = /^(s|ly|ness|less|ful|fully|ster|sters|dom|doms|wise|ward|wards)$/

const DETECTORS: Record<number, Detector> = {
  // Nguyên âm đứng cuối âm tiết: từ một âm tiết kết thúc bằng nguyên âm (go, me),
  // hoặc âm tiết đầu mở trong từ hai âm tiết (pa·per, ti·ger) — chỉ lấy khi từ
  // điển xác nhận âm đầu là âm dài có nhấn, vì VCV vốn mơ hồ (city, never).
  1: (w, s, push, pushEx) => {
    const vowels = s.filter(isVowelSound)
    const one = /^[^aeiouy]+([aeiou])$/.exec(w)
    if (one && vowels.length === 1) {
      const letter = one[1]
      const at = w.length - 1
      if (LONG[letter].includes(vowels[0].base)) push({ word: w, start: at, end: w.length, options: LONG_SHORT, answer: 'long' })
      else if (SHORT[letter].includes(vowels[0].base) || vowels[0].base === 'ə' || vowels[0].base === 'uː')
        pushEx({ word: w, start: at, end: w.length, expected: 'long', actual: `đọc /${vowels[0].base}/` })
      return
    }
    const open = /^([^aeiouy]+)([aeiou])[^aeiouywrx][aeiouy]/.exec(w)
    if (open && vowels.length === 2) {
      const letter = open[2]
      const first = s.find(isVowelSound)!
      if (first.stress === 'primary' && LONG[letter].includes(first.base)) {
        const at = open[1].length
        push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'long' })
      }
    }
  },

  // Nguyên âm không đứng cuối: từ một âm tiết có đúng một chữ nguyên âm, sau nó là phụ âm
  // (không tính r, w, y vì ar, aw, ay là âm khác; không có e cuối).
  2: (w, s, push, pushEx) => {
    const m = /^([^aeiouy]*)([aeiou])([^aeiouyrw]+)$/.exec(w)
    // gh (high, night) và h ngay sau nguyên âm (oh) là quy tắc khác.
    if (!m || /gh/.test(w) || m[3].startsWith('h')) return
    // a trước l (all, talk, salt) đọc /or/ — là một quy tắc khác, bỏ qua.
    if (m[2] === 'a' && m[3].startsWith('l')) return
    // Cần có phụ âm đứng trước nguyên âm hoặc không — đều được; nhưng qu/wa là âm khác.
    if (/(qu|w)$/.test(m[1])) return
    const vowels = s.filter(isVowelSound)
    if (vowels.length !== 1) return
    const letter = m[2]
    const at = m[1].length
    const v = vowels[0].base
    // Cụm: nguyên âm + các phụ âm đứng sau nó (cat → at).
    if (SHORT[letter].includes(v))
      push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'short', cluster: [at, w.length] })
    else if (LONG[letter].includes(v)) pushEx({ word: w, start: at, end: at + 1, expected: 'short', actual: `đọc dài /${v}/` })
  },

  // Hai nguyên âm: từ một âm tiết có đúng một cụm nguyên âm là ai, ea, ee, oa, oe, ie, ue, ui.
  // y không tính là nguyên âm, nên ay, ey (day, key) không thuộc quy tắc này.
  3: (w, s, push, pushEx) => {
    const m = /^([^aeiouy]+)(ai|ea|ee|oa|oe|ie|ue|ui)([^aeiouy]*)$/.exec(w)
    // Có r ngay sau (bear, deer, boar) là âm khác: /air/, /eer/, /or/. qu: u thuộc phụ âm /kw/.
    if (!m || m[3].startsWith('r') || /qu$/.test(m[1] + m[2][0])) return
    const vowels = s.filter(isVowelSound)
    if (vowels.length !== 1) return
    const first = m[2][0]
    const at = m[1].length
    const v = vowels[0].base
    // u dài có thể là /yoo/ hoặc Long /oo/; e dài trong ee/ea là /ee/.
    if (LONG[first].includes(v)) {
      const cluster: [number, number] = [at, at + 2]
      push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'long', cluster })
      push({ word: w, start: at + 1, end: at + 2, options: ['sounded', 'silent'], answer: 'silent', cluster })
    } else {
      pushEx({ word: w, start: at, end: at + 2, expected: 'long', actual: `đọc /${v}/` })
    }
  },

  // Hai phụ âm giống nhau: đếm âm trong từ điển — mỗi cặp chỉ ra một âm.
  4: (w, s, push, pushEx) => {
    const m = /([bdfglmnpstz])\1/.exec(w)
    if (!m) return
    const letter = m[1]
    // Chỉ một cặp, và chữ đó không xuất hiện lẻ ở chỗ khác (đếm cho chắc).
    if (countText(w, new RegExp(letter, 'g')) !== 2) return
    // ss/s hay đọc /z/, gg trước e/i đọc /dʒ/ — chỉ đếm khi chắc chắn.
    const sound = letter === 's' ? 's' : letter
    if (letter === 'g' && /gg[eiy]/.test(w)) return
    const n = count(s, sound)
    const at = m.index
    if (n === 1) {
      push({ word: w, start: at + 1, end: at + 2, options: ['sounded', 'silent'], answer: 'silent', cluster: [at, at + 2] })
    } else if (n === 2 && !OTHER_SOURCES[letter]?.test(w)) {
      pushEx({ word: w, start: at, end: at + 2, expected: 'silent', actual: 'đọc cả hai chữ' })
    }
  },

  // tch: tch đọc /ch/ — t không thành /t/ riêng.
  5: (w, s, push, pushEx) => {
    const at = w.indexOf('tch')
    if (at === -1) return
    if (s.some((x) => x.base === 'tʃ'))
      push({ word: w, start: at, end: at + 1, options: ['sounded', 'silent'], answer: 'silent', cluster: [at, at + 3] })
    else pushEx({ word: w, start: at, end: at + 3, expected: 'silent', actual: 'không đọc /ch/' })
  },

  // n trước /g/, /k/ (chữ k, c cứng, x, q, g) → /ng/.
  // ng: quy tắc đoán /ng/./g/ khi ng ở giữa từ gốc và g đứng trước a, o, u hoặc phụ âm;
  // còn lại chỉ /ng/. Từ điển đọc khác thì là ngoại lệ (thường là từ ghép: hangover).
  6: (w, s, push, pushEx) => {
    const ngCount = count(s, 'ŋ')
    // c chỉ đọc /k/ khi không đứng trước e, i, y, h (fancy đọc /s/, lunch đọc /ch/: không thuộc quy tắc).
    const nk = /n(k|c(?![eiyh])|x|q)/.exec(w)
    // ng + e/i/y có thể là g mềm (danger, change): từ điển không có /ŋ/ thì tự bỏ qua.
    const ng = /ng/.exec(w)
    const nTotal = countText(w, /n/g)
    if (nk && !ng && countText(w, /n(k|c(?![eiyh])|x|q)/g) === 1) {
      if (ngCount === 1)
        push({ word: w, start: nk.index, end: nk.index + 1, options: ['n', 'ng'], answer: 'ng', cluster: [nk.index, nk.index + 2] })
      else if (ngCount === 0 && count(s, 'n') === nTotal)
        pushEx({ word: w, start: nk.index, end: nk.index + 1, expected: 'ng', actual: 'đọc /n/' })
      return
    }
    if (ng && !nk && countText(w, /ng/g) === 1 && ngCount === 1) {
      const i = s.findIndex((x) => x.base === 'ŋ')
      const actual: Outcome = s[i + 1]?.base === 'g' ? 'ngg' : 'ng'
      const rest = w.slice(ng.index + 2)
      const middle = ng.index > 0 && rest.length > 0
      const root = !NG_SUFFIX.test(rest)
      const hardG = /^[^eiy]/.test(rest)
      const expected: Outcome = middle && root && hardG ? 'ngg' : 'ng'
      const at = { word: w, start: ng.index, end: ng.index + 2 }
      // Cụm: ng + chữ quyết định đứng sau (hungry → ngr, singer → nge).
      const cluster: [number, number] = [ng.index, Math.min(ng.index + 3, w.length)]
      if (actual === expected) push({ ...at, options: ['ng', 'ngg'], answer: expected, cluster })
      else pushEx({ ...at, expected, actual: actual === 'ngg' ? 'đọc /ng/./g/' : 'chỉ đọc /ng/' })
    }
  },

  7: (w, s, push, pushEx) => {
    if (!w.startsWith('kn')) return
    if (s[0]?.base === 'n') push({ word: w, start: 0, end: 1, options: ['k', 'silent'], answer: 'silent', cluster: [0, 2] })
    else pushEx({ word: w, start: 0, end: 1, expected: 'silent', actual: 'đọc /k/' })
  },

  8: (w, s, push, pushEx) => {
    if (!w.startsWith('wr')) return
    if (s[0]?.base === 'ɹ') push({ word: w, start: 0, end: 1, options: ['sounded', 'silent'], answer: 'silent', cluster: [0, 2] })
    else pushEx({ word: w, start: 0, end: 1, expected: 'silent', actual: 'đọc /w/' })
  },

  9: (w, s, push, pushEx) => {
    if (!w.startsWith('gn')) return
    if (s[0]?.base === 'n') push({ word: w, start: 0, end: 1, options: ['g', 'silent'], answer: 'silent', cluster: [0, 2] })
    else pushEx({ word: w, start: 0, end: 1, expected: 'silent', actual: 'đọc /g/' })
  },

  // c: chỉ lấy từ có đúng một chữ c (không ch, ck, sc, cc) và không có x, q, kn, để
  // đếm được âm /k/: c cứng thì từ điển có thêm đúng một /k/ so với các chữ k.
  10: (w, s, push, pushEx) => {
    if (countText(w, /c/g) !== 1 || /ch|ck|sc|[xq]|kn/.test(w)) return
    const at = w.indexOf('c')
    const next = w[at + 1]
    // ci/ce + nguyên âm (special, ocean) đọc /sh/ — quy tắc khác.
    if (/c[ei][aeiou]/.test(w)) return
    const kLetters = countText(w, /k/g)
    const kSounds = count(s, 'k')
    // Cụm: c + chữ đứng sau (ce, ca, ct); c cuối từ thì chỉ c.
    const cluster: [number, number] = [at, Math.min(at + 2, w.length)]
    if (next && 'eiy'.includes(next)) {
      if (kSounds === kLetters && s.some((x) => x.base === 's'))
        push({ word: w, start: at, end: at + 1, options: ['s', 'k'], answer: 's', cluster })
      else if (kSounds === kLetters + 1) pushEx({ word: w, start: at, end: at + 1, expected: 's', actual: 'đọc /k/' })
      return
    }
    // Còn lại: trước a, o, u, phụ âm, hoặc c cuối từ (music, magic) → /k/.
    if (kSounds === kLetters + 1) push({ word: w, start: at, end: at + 1, options: ['s', 'k'], answer: 'k', cluster })
    else if (kSounds === kLetters) pushEx({ word: w, start: at, end: at + 1, expected: 'k', actual: 'không đọc /k/' })
  },

  // g: tương tự, một chữ g (không gh, gn, gg, ng, dg) và không có x (x có thể là /gz/).
  11: (w, s, push, pushEx) => {
    if (countText(w, /g/g) !== 1 || /gh|gn|gg|ng|dg|x/.test(w)) return
    const at = w.indexOf('g')
    const next = w[at + 1]
    if (next === undefined) return
    const hard = count(s, 'g') === 1
    const soft = count(s, 'dʒ') === countText(w, /j/g) + 1
    const cluster: [number, number] = [at, at + 2]
    if ('eiy'.includes(next)) {
      if (soft && !hard) push({ word: w, start: at, end: at + 1, options: ['j', 'g'], answer: 'j', cluster })
      else if (hard) pushEx({ word: w, start: at, end: at + 1, expected: 'j', actual: 'đọc /g/' })
      return
    }
    if (hard) push({ word: w, start: at, end: at + 1, options: ['j', 'g'], answer: 'g', cluster })
    else if (soft) pushEx({ word: w, start: at, end: at + 1, expected: 'g', actual: 'đọc /j/' })
  },

  12: (w, s, push, pushEx) => {
    // eigh, aigh (eight, straight) là cụm khác: i thuộc ei / ai, không phải "i trước gh".
    const at = w.indexOf('igh')
    if (at === -1 || countText(w, /igh/g) !== 1 || /[aeiou]igh/.test(w)) return
    if (s.some((x) => x.base === 'aɪ')) {
      const cluster: [number, number] = [at, at + 3]
      push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'long', cluster })
      push({ word: w, start: at + 1, end: at + 3, options: ['sounded', 'silent'], answer: 'silent', cluster })
    } else {
      pushEx({ word: w, start: at, end: at + 3, expected: 'long', actual: 'không đọc /igh/' })
    }
  },

  // y cuối, phụ âm đứng trước, đúng 2 âm tiết, nhấn âm đầu.
  13: (w, s, push, pushEx) => {
    if (!/[^aeiouy]y$/.test(w)) return
    const vowels = s.filter(isVowelSound)
    if (vowels.length !== 2 || vowels[0].stress !== 'primary') return
    const last = s[s.length - 1]
    const at = w.length - 1
    if (last.base === 'i' || last.base === 'ɪ' || last.base === 'iː')
      push({ word: w, start: at, end: at + 1, options: ['i', 'igh'], answer: 'i' })
    else if (last.base === 'aɪ') pushEx({ word: w, start: at, end: at + 1, expected: 'i', actual: 'đọc /igh/' })
  },

  // e cuối từ ≥ 2 âm tiết (không tính ee, ie, ye, oe, ue — đó là cụm nguyên âm).
  14: (w, s, push, pushEx) => {
    // -re, -le (fire, acre, table): e nằm trong âm /ur/, /ul/ — không xét.
    if (!/[^aeiouy]e$/.test(w) || /re$|[^aeiou]le$/.test(w)) return
    const vowels = s.filter(isVowelSound)
    const last = s[s.length - 1]
    if (!last) return
    if (!isVowelSound(last)) {
      if (vowels.length >= 2) push({ word: w, start: w.length - 1, end: w.length, options: ['sounded', 'silent'], answer: 'silent' })
    } else if (vowels.length >= 3 || (vowels.length === 2 && /^[^aeiouy]*[aeiouy][^aeiouy]+e$/.test(w))) {
      // Đọc e cuối (recipe, karate). Nếu từ chỉ có một nguyên âm viết khác, cần
      // 2 âm tiết đọc để chắc e cuối là âm tiết riêng.
      pushEx({ word: w, start: w.length - 1, end: w.length, expected: 'silent', actual: `đọc /${last.base}/` })
    }
  },
}

const SHORT_WORDS = new Set([
  'go', 'no', 'so', 'do', 'to', 'me', 'he', 'we', 'be', 'hi', 'if', 'in', 'is', 'it', 'at', 'an', 'am', 'up', 'us', 'on', 'as',
])

export interface RuleBank {
  questions: RuleQuestion[]
  exceptions: RuleException[]
  /** Từ → IPA đầu tiên, để hiện khi trả lời. */
  pron: Map<string, string>
}

/**
 * Quét danh sách từ, sinh câu hỏi và ngoại lệ cho mọi quy tắc. Chỉ dùng phát âm đầu
 * tiên trong từ điển (giọng Anh phổ biến nhất). Bỏ qua từ có chữ ngoài a–z.
 */
export function buildRuleBank(words: string[], prons: Record<string, string[]>): RuleBank {
  const questions: RuleQuestion[] = []
  const exceptions: RuleException[] = []
  const pron = new Map<string, string>()
  const seen = new Set<string>()

  for (const raw of words) {
    const w = raw.toLowerCase()
    if (seen.has(w) || !/^[a-z]+$/.test(w)) continue
    // Từ 2 chữ cái trong từ điển phần lớn là tên chữ / viết tắt (el, em, ex): chỉ giữ từ thường gặp.
    if (w.length < 3 && !SHORT_WORDS.has(w)) continue
    seen.add(w)
    const p = prons[w]?.[0]
    if (!p) continue
    const sounds = parsePron(p)
    let used = false
    for (const rule of SOUND_RULES) {
      DETECTORS[rule.id](
        w,
        sounds,
        (q) => {
          questions.push({ ...q, ruleId: rule.id })
          used = true
        },
        (e) => {
          exceptions.push({ ...e, ruleId: rule.id })
          used = true
        },
      )
    }
    if (used) pron.set(w, p)
  }
  return { questions, exceptions, pron }
}

export interface MarkSegment {
  text: string
  /** Nằm trong cụm của quy tắc. */
  cluster: boolean
  /** Là chữ được hỏi. */
  asked: boolean
}

/** Cắt từ thành các đoạn để tô cả cụm quy tắc, gạch chân riêng chữ được hỏi. */
export function markSegments(word: string, start: number, end: number, cluster?: [number, number]): MarkSegment[] {
  const [cs, ce] = cluster ?? [start, end]
  const cuts = [...new Set([0, cs, ce, start, end, word.length])].sort((a, b) => a - b)
  const out: MarkSegment[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]]
    if (a === b) continue
    out.push({ text: word.slice(a, b), cluster: a >= cs && b <= ce, asked: a >= start && b <= end })
  }
  return out
}

/**
 * Chọn câu hỏi tiếp theo: ưu tiên quy tắc đang yếu (sai gần đây nhiều) và từ ngắn
 * (thường gặp hơn). `rules` rỗng = mọi quy tắc. Tránh lặp từ vừa hỏi.
 */
export function pickQuestion(
  bank: RuleQuestion[],
  rules: number[],
  recentWords: string[],
  weakness: (ruleId: number) => number,
  rng: () => number = Math.random,
): RuleQuestion | null {
  const pool = bank.filter((q) => (rules.length === 0 || rules.includes(q.ruleId)) && !recentWords.includes(q.word))
  if (pool.length === 0) return null
  // Chọn quy tắc trước (để quy tắc ít từ vẫn được hỏi đều), có trọng số theo độ yếu.
  const ruleIds = [...new Set(pool.map((q) => q.ruleId))]
  const weights = ruleIds.map((id) => 1 + 2 * weakness(id))
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  let ruleId = ruleIds[ruleIds.length - 1]
  for (let i = 0; i < ruleIds.length; i++) {
    r -= weights[i]
    if (r < 0) {
      ruleId = ruleIds[i]
      break
    }
  }
  // Trong quy tắc: nghiêng về từ ngắn — lấy ngẫu nhiên trong nửa ngắn hơn phần lớn thời gian.
  const inRule = pool.filter((q) => q.ruleId === ruleId).sort((a, b) => a.word.length - b.word.length)
  const span = rng() < 0.75 ? Math.max(1, Math.ceil(inRule.length / 2)) : inRule.length
  return inRule[Math.floor(rng() * span)]
}

export const QUIZ_RECENT = 20

export function recordQuiz(stat: RuleQuizStat | undefined, ok: boolean): RuleQuizStat {
  const s = stat ?? { correct: 0, wrong: 0, recent: [] }
  return {
    correct: s.correct + (ok ? 1 : 0),
    wrong: s.wrong + (ok ? 0 : 1),
    recent: [...s.recent, ok].slice(-QUIZ_RECENT),
  }
}

/** Tỉ lệ sai gần đây, 0..1. Chưa làm câu nào = 0.5 (ưu tiên vừa phải). */
export function weaknessOf(stat: RuleQuizStat | undefined): number {
  if (!stat || stat.recent.length === 0) return 0.5
  return stat.recent.filter((x) => !x).length / stat.recent.length
}
