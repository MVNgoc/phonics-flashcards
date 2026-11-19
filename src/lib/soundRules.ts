import type { RuleQuizStat } from './types'

export interface RuleCard {
  id: string
  cue: string
  result: string
  examples: string[]
}

export interface SoundRule {
  id: number
  title: string
  text: string
  examples: string[]
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
  {
    id: 15,
    title: 'e, i, o, u + r → /ur/',
    text: 'Các nguyên âm e, i, o, u đứng trước r thì đọc /ur/.',
    examples: ['her', 'bird', 'word', 'turn'],
    note: 'Ngoại lệ hay gặp: for, more, store (or → /or/).',
    cards: [
      {
        id: 'r15',
        cue: 'e, i, o, u đứng trước r',
        result: 'Đọc /ur/',
        examples: ['her', 'bird', 'word', 'turn'],
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
  | 'ur'

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
  ur: '/ur/',
}

export interface RuleQuestion {
  ruleId: number
  word: string
  start: number
  end: number
  options: Outcome[]
  answer: Outcome
  cluster?: [number, number]
}

export interface RuleException {
  ruleId: number
  word: string
  start: number
  end: number
  expected: Outcome
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

const LONG: Record<string, string[]> = { a: ['eɪ'], e: ['iː'], i: ['aɪ'], o: ['əʊ'], u: ['uː'] }
const SHORT: Record<string, string[]> = { a: ['æ'], e: ['ɛ'], i: ['ɪ'], o: ['ɒ'], u: ['ɐ', 'ʌ', 'ʊ'] }

export function showPron(pron: string): string {
  return `/${pron.replace(/ /g, '')}/`
}

const count = (sounds: Sound[], base: string) => sounds.filter((s) => s.base === base).length
const countText = (word: string, re: RegExp) => (word.match(re) ?? []).length

type Push = (q: Omit<RuleQuestion, 'ruleId'>) => void
type PushEx = (e: Omit<RuleException, 'ruleId'>) => void
type Detector = (word: string, sounds: Sound[], push: Push, pushEx: PushEx) => void

const LONG_SHORT: Outcome[] = ['long', 'short']

// Chữ khác cũng ra âm này (access: cc → /ks/) thì đếm âm không kết luận được.
const OTHER_SOURCES: Record<string, RegExp> = {
  s: /c|x|z/,
  z: /s/,
  t: /ed$|ch/,
  d: /ed$/,
  f: /ph|gh/,
  g: /x/,
}

const NG_SUFFIX = /^(s|ly|ness|less|ful|fully|ster|sters|dom|doms|wise|ward|wards)$/

const DETECTORS: Record<number, Detector> = {
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

  2: (w, s, push, pushEx) => {
    const m = /^([^aeiouy]*)([aeiou])([^aeiouyrw]+)$/.exec(w)
    if (!m || /gh/.test(w) || m[3].startsWith('h')) return
    if (m[2] === 'a' && m[3].startsWith('l')) return
    if (/(qu|w)$/.test(m[1])) return
    const vowels = s.filter(isVowelSound)
    if (vowels.length !== 1) return
    const letter = m[2]
    const at = m[1].length
    const v = vowels[0].base
    if (SHORT[letter].includes(v))
      push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'short', cluster: [at, w.length] })
    else if (LONG[letter].includes(v)) pushEx({ word: w, start: at, end: at + 1, expected: 'short', actual: `đọc dài /${v}/` })
  },

  // y không tính là nguyên âm, nên ay, ey (day, key) không thuộc quy tắc này.
  3: (w, s, push, pushEx) => {
    const m = /^([^aeiouy]+)(ai|ea|ee|oa|oe|ie|ue|ui)([^aeiouy]*)$/.exec(w)
    if (!m || m[3].startsWith('r') || /qu$/.test(m[1] + m[2][0])) return
    const vowels = s.filter(isVowelSound)
    if (vowels.length !== 1) return
    const first = m[2][0]
    const at = m[1].length
    const v = vowels[0].base
    if (LONG[first].includes(v)) {
      const cluster: [number, number] = [at, at + 2]
      push({ word: w, start: at, end: at + 1, options: LONG_SHORT, answer: 'long', cluster })
      push({ word: w, start: at + 1, end: at + 2, options: ['sounded', 'silent'], answer: 'silent', cluster })
    } else {
      pushEx({ word: w, start: at, end: at + 2, expected: 'long', actual: `đọc /${v}/` })
    }
  },

  4: (w, s, push, pushEx) => {
    const m = /([bdfglmnpstz])\1/.exec(w)
    if (!m) return
    const letter = m[1]
    if (countText(w, new RegExp(letter, 'g')) !== 2) return
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

  5: (w, s, push, pushEx) => {
    const at = w.indexOf('tch')
    if (at === -1) return
    if (s.some((x) => x.base === 'tʃ'))
      push({ word: w, start: at, end: at + 1, options: ['sounded', 'silent'], answer: 'silent', cluster: [at, at + 3] })
    else pushEx({ word: w, start: at, end: at + 3, expected: 'silent', actual: 'không đọc /ch/' })
  },

  6: (w, s, push, pushEx) => {
    const ngCount = count(s, 'ŋ')
    const nk = /n(k|c(?![eiyh])|x|q)/.exec(w)
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

  // c cứng thì từ điển có thêm đúng một /k/ so với số chữ k.
  10: (w, s, push, pushEx) => {
    if (countText(w, /c/g) !== 1 || /ch|ck|sc|[xq]|kn/.test(w)) return
    const at = w.indexOf('c')
    const next = w[at + 1]
    if (/c[ei][aeiou]/.test(w)) return
    const kLetters = countText(w, /k/g)
    const kSounds = count(s, 'k')
    const cluster: [number, number] = [at, Math.min(at + 2, w.length)]
    if (next && 'eiy'.includes(next)) {
      if (kSounds === kLetters && s.some((x) => x.base === 's'))
        push({ word: w, start: at, end: at + 1, options: ['s', 'k'], answer: 's', cluster })
      else if (kSounds === kLetters + 1) pushEx({ word: w, start: at, end: at + 1, expected: 's', actual: 'đọc /k/' })
      return
    }
    if (kSounds === kLetters + 1) push({ word: w, start: at, end: at + 1, options: ['s', 'k'], answer: 'k', cluster })
    else if (kSounds === kLetters) pushEx({ word: w, start: at, end: at + 1, expected: 'k', actual: 'không đọc /k/' })
  },

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

  14: (w, s, push, pushEx) => {
    if (!/[^aeiouy]e$/.test(w) || /re$|[^aeiou]le$/.test(w)) return
    const vowels = s.filter(isVowelSound)
    const last = s[s.length - 1]
    if (!last) return
    if (!isVowelSound(last)) {
      if (vowels.length >= 2) push({ word: w, start: w.length - 1, end: w.length, options: ['sounded', 'silent'], answer: 'silent' })
    } else if (vowels.length >= 3 || (vowels.length === 2 && /^[^aeiouy]*[aeiouy][^aeiouy]+e$/.test(w))) {
      pushEx({ word: w, start: w.length - 1, end: w.length, expected: 'silent', actual: `đọc /${last.base}/` })
    }
  },

  15: (w, s, push, pushEx) => {
    if (countText(w, /[aeiouy]r/g) !== 1) return
    const m = /(?:^|[^aeiouy])([eiou])r(?![aeiouy])/.exec(w)
    if (!m) return
    const at = m.index + m[0].indexOf(m[1])
    const hasUr = s.some((x) => x.base === 'ɜː')
    if (hasUr) push({ word: w, start: at, end: at + 2, options: ['ur', 'short'], answer: 'ur' })
    else if (s.filter(isVowelSound).length === 1)
      pushEx({ word: w, start: at, end: at + 2, expected: 'ur', actual: 'không đọc /ur/' })
  },
}

const SHORT_WORDS = new Set([
  'go', 'no', 'so', 'do', 'to', 'me', 'he', 'we', 'be', 'hi', 'if', 'in', 'is', 'it', 'at', 'an', 'am', 'up', 'us', 'on', 'as',
])

export interface RuleBank {
  questions: RuleQuestion[]
  exceptions: RuleException[]
  pron: Map<string, string>
}

export function buildRuleBank(words: string[], prons: Record<string, string[]>): RuleBank {
  const questions: RuleQuestion[] = []
  const exceptions: RuleException[] = []
  const pron = new Map<string, string>()
  const seen = new Set<string>()

  for (const raw of words) {
    const w = raw.toLowerCase()
    if (seen.has(w) || !/^[a-z]+$/.test(w)) continue
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
  cluster: boolean
  asked: boolean
}

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

export function pickQuestion(
  bank: RuleQuestion[],
  rules: number[],
  recentWords: string[],
  weakness: (ruleId: number) => number,
  rng: () => number = Math.random,
): RuleQuestion | null {
  const pool = bank.filter((q) => (rules.length === 0 || rules.includes(q.ruleId)) && !recentWords.includes(q.word))
  if (pool.length === 0) return null
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

export function weaknessOf(stat: RuleQuizStat | undefined): number {
  if (!stat || stat.recent.length === 0) return 0.5
  return stat.recent.filter((x) => !x).length / stat.recent.length
}
