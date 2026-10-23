import { labelKey, type Answer, type DictationItem, type Step } from './dictation'

/**
 * Mẹo chính tả: nghe ra đuôi âm nào thì thường viết thế nào. Nội dung theo
 * "English Appendix 1: Spelling" — National Curriculum in England (Department for
 * Education, 2013), phần quy tắc chính tả cho tiểu học. Mỗi mẹo ghi lớp (Year) mà
 * tài liệu đó dạy.
 *
 * Mẹo khớp theo đuôi đáp án (dãy âm + cách cắt chữ), nên trang Nghe đếm được trong
 * bộ luyện mẹo đó đúng bao nhiêu: "-ous 55 · -us 48".
 */

export const TIPS_SOURCE = {
  title: 'English Appendix 1: Spelling — National Curriculum in England (DfE, 2013)',
  url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study',
}

/** Một âm trong mẫu: cách gõ được chấp nhận (dạng chuẩn hoá) và/hoặc phải là nguyên âm lướt (schwa). */
interface PatternPart {
  tokens?: string[]
  reduced?: boolean
}

export interface SpellingTip {
  id: string
  /** Đuôi âm, vd "/u/s/". */
  sound: string
  /** Cách viết thường gặp, vd "-ous". */
  spelling: string
  explain: string
  /** Lớp dạy mẹo này trong tài liệu nguồn. */
  stage: string
  /** Mẫu âm ở cuối từ. */
  pattern: PatternPart[]
  minSyllables?: number
  maxSyllables?: number
  /** Ngay trước mẫu phải là một chữ nguyên âm đọc ngắn (catch, back — không phải talk, cook). */
  afterShortVowel?: boolean
}

const t = (...tokens: string[]): PatternPart => ({ tokens })
const SCHWA: PatternPart = { reduced: true }
/** Nguyên âm ngắn: a (cat), e (bed), i (sit), o (hot), u (cup), oo ngắn (put). */
const SHORT_SOUNDS = new Set(['æ', 'ɛ', 'ɪ', 'ɒ', 'ɐ', 'ʊ'])

export const SPELLING_TIPS: SpellingTip[] = [
  {
    id: 'ous',
    sound: '/u/s/',
    spelling: '-ous',
    explain:
      'Tính từ đọc /u/s/ ở cuối gần như luôn viết -ous (famous, dangerous, nervous, various). Danh từ thì thường là -us (campus, virus, bonus, status).',
    stage: 'Year 3–4',
    pattern: [{ tokens: ['u'], reduced: true }, t('s')],
    minSyllables: 2,
  },
  {
    id: 'cious-tious',
    sound: '/sh/u/s/',
    spelling: '-cious / -tious',
    explain:
      'Từ gốc có -ce thì viết -cious (space → spacious, grace → gracious, vice → vicious). Từ gốc có -tion thì viết -tious (ambition → ambitious, infection → infectious). Ngoại lệ: anxious.',
    stage: 'Year 5–6',
    pattern: [t('sh'), SCHWA, t('s')],
    minSyllables: 2,
  },
  {
    id: 'tion',
    sound: '/sh/u/n/',
    spelling: '-tion / -ssion / -sion / -cian',
    explain:
      '-tion phổ biến nhất (nation, action, invention). -ssion khi từ gốc tận cùng -ss hoặc -mit (discuss → discussion, admit → admission). -sion khi từ gốc tận cùng -d hoặc -se (expand → expansion, tense → tension). -cian khi từ gốc tận cùng -c hoặc -cs, thường chỉ người (music → musician, electric → electrician).',
    stage: 'Year 3–4',
    pattern: [t('sh'), SCHWA, t('n')],
    minSyllables: 2,
  },
  {
    id: 'sion-zh',
    sound: '/zh/u/n/',
    spelling: '-sion',
    explain: 'Đuôi /zh/u/n/ viết -sion (vision, television, decision, division, confusion).',
    stage: 'Year 3–4',
    pattern: [t('zh'), SCHWA, t('n')],
    minSyllables: 2,
  },
  {
    id: 'ture',
    sound: '/ch/ur/',
    spelling: '-ture',
    explain: 'Đuôi /ch/ur/ thường viết -ture (picture, nature, adventure, creature, furniture).',
    stage: 'Year 3–4',
    pattern: [t('ch'), { tokens: ['ur'], reduced: true }],
    minSyllables: 2,
  },
  {
    id: 'sure',
    sound: '/zh/ur/',
    spelling: '-sure',
    explain: 'Đuôi /zh/ur/ viết -sure (measure, treasure, pleasure, enclosure).',
    stage: 'Year 3–4',
    pattern: [t('zh'), { tokens: ['ur'], reduced: true }],
    minSyllables: 2,
  },
  {
    id: 'cial-tial',
    sound: '/sh/ul/',
    spelling: '-cial / -tial',
    explain:
      '-cial thường đứng sau nguyên âm (official, special, artificial). -tial thường đứng sau phụ âm (partial, confidential, essential). Ngoại lệ: initial, financial, commercial, provincial.',
    stage: 'Year 5–6',
    pattern: [t('sh'), t('ul')],
    minSyllables: 2,
  },
  {
    id: 'able-ible',
    sound: '/u/b/ul/',
    spelling: '-able / -ible',
    explain:
      '-able phổ biến hơn -ible. Bỏ đuôi đi mà còn lại một từ trọn vẹn thì thường là -able (depend → dependable, comfort → comfortable); không thì thường là -ible (possible, horrible, terrible, visible). Từ có họ -ation thì dùng -able (adoration → adorable).',
    stage: 'Year 5–6',
    pattern: [SCHWA, t('b'), t('ul')],
    minSyllables: 3,
  },
  {
    id: 'ant-ent',
    sound: '/u/n/t/',
    spelling: '-ant / -ent',
    explain:
      'Không nghe ra -ant hay -ent. Có từ cùng họ đọc rõ /ai/ hoặc /a/ (observation, hesitation) thì dùng -ant (observant, hesitant). Sau c đọc /s/, g đọc /j/ hoặc qu thì dùng -ent (innocent, decent, intelligent, frequent). Còn lại phải nhớ từng từ.',
    stage: 'Year 5–6',
    pattern: [SCHWA, t('n'), t('t')],
    minSyllables: 2,
  },
  {
    id: 'ance-ence',
    sound: '/u/n/s/',
    spelling: '-ance / -ence',
    explain:
      'Đi theo -ant / -ent: observant → observance, innocent → innocence, frequent → frequency. Sau c đọc /s/, g đọc /j/ hoặc qu thì dùng -ence (innocence, intelligence). Còn lại phải nhớ từng từ.',
    stage: 'Year 5–6',
    pattern: [SCHWA, t('n'), t('s')],
    minSyllables: 2,
  },
  {
    id: 'le-el-al-il',
    sound: '/ul/',
    spelling: '-le / -el / -al / -il',
    explain:
      '-le phổ biến nhất (table, apple, little, middle). -el sau m, n, r, s, v, w và hay sau s (camel, tunnel, squirrel, travel, towel). -al hay gặp ở tính từ (metal, animal, hospital, normal). -il ít gặp (pencil, fossil, nostril).',
    stage: 'Year 2',
    pattern: [t('ul')],
    minSyllables: 2,
  },
  {
    id: 'y-ee',
    sound: '/ee/ hoặc /i/ cuối từ',
    spelling: '-y',
    explain: 'Âm /ee/ (hay /i/ nhẹ) ở cuối từ 2 âm tiết trở lên thường viết -y (happy, funny, family, story).',
    stage: 'Year 1',
    pattern: [t('i', 'ee')],
    minSyllables: 2,
  },
  {
    id: 'y-igh',
    sound: '/igh/ cuối từ',
    spelling: '-y',
    explain: 'Âm /igh/ ở cuối từ thường viết -y (cry, fly, dry, try, reply, July).',
    stage: 'Year 2',
    pattern: [t('igh')],
  },
  {
    id: 'dge-ge',
    sound: '/j/ cuối từ',
    spelling: '-dge / -ge',
    explain:
      'Ngay sau nguyên âm ngắn viết -dge (badge, edge, bridge, dodge, fudge). Sau nguyên âm dài, phụ âm hoặc /u/ lướt (schwa) viết -ge (age, huge, change, charge, village).',
    stage: 'Year 2',
    pattern: [t('j')],
  },
  {
    id: 'tch',
    sound: '/ch/ sau nguyên âm ngắn',
    spelling: '-tch',
    explain: 'Ngay sau nguyên âm ngắn, /ch/ thường viết tch (catch, fetch, kitchen, notch, hutch). Ngoại lệ: rich, which, much, such.',
    stage: 'Year 1',
    pattern: [t('ch')],
    afterShortVowel: true,
  },
  {
    id: 'ck',
    sound: '/k/ sau nguyên âm ngắn',
    spelling: '-ck',
    explain: 'Từ một âm tiết, /k/ ngay sau nguyên âm ngắn viết ck (back, neck, sick, lock, duck).',
    stage: 'Year 1',
    pattern: [t('k')],
    afterShortVowel: true,
    maxSyllables: 1,
  },
  {
    id: 'ff-ll-ss-zz',
    sound: '/f/, /l/, /s/, /z/ sau nguyên âm ngắn',
    spelling: '-ff / -ll / -ss / -zz',
    explain: 'Từ một âm tiết, /f/ /l/ /s/ /z/ ngay sau nguyên âm ngắn thường viết đôi (off, well, miss, buzz). Ngoại lệ: if, pal, us, bus, yes.',
    stage: 'Year 1',
    pattern: [t('f', 'l', 's', 'z')],
    afterShortVowel: true,
    maxSyllables: 1,
  },
  {
    id: 've',
    sound: '/v/ cuối từ',
    spelling: '-ve',
    explain: 'Từ tiếng Anh gần như không kết thúc bằng chữ v: có /v/ cuối thì viết -ve (have, live, give, love, active).',
    stage: 'Year 1',
    pattern: [t('v')],
  },
]

/** Đuôi của đáp án khớp mẫu của mẹo → các bước âm khớp; không khớp → null. */
function matchTip(tip: SpellingTip, answer: Answer): Step[] | null {
  const steps = answer.steps
  if (!steps) return null
  if (tip.minSyllables && answer.nuclei < tip.minSyllables) return null
  if (tip.maxSyllables && answer.nuclei > tip.maxSyllables) return null
  const k = tip.pattern.length
  if (steps.length < k) return null
  const tail = steps.slice(-k)
  const ok = tip.pattern.every((part, i) => {
    const step = tail[i]
    if (part.tokens && !part.tokens.includes(labelKey(step.token))) return false
    if (part.reduced && !step.reduced) return false
    return true
  })
  if (!ok) return null
  if (tip.afterShortVowel) {
    const before = steps[steps.length - k - 1]
    const single = before && /^[aeiouy]$/.test(before.spelling)
    if (!single || before.reduced || !before.sounds.some((x) => SHORT_SOUNDS.has(x))) return null
  }
  return tail
}

export interface TipHit {
  tip: SpellingTip
  /** Cách từ này viết đuôi đó, vd "ous". */
  spelling: string
}

/** Các mẹo áp dụng cho một từ (xét mọi đáp án, lấy đáp án khớp đầu tiên). */
export function tipsFor(item: DictationItem): TipHit[] {
  const hits: TipHit[] = []
  for (const tip of SPELLING_TIPS) {
    for (const answer of item.answers) {
      const tail = matchTip(tip, answer)
      if (!tail) continue
      hits.push({ tip, spelling: tail.map((s) => s.spelling).join('') })
      break
    }
  }
  return hits
}

export interface TipStats {
  /** Từ trong bộ luyện khớp mẹo. */
  words: string[]
  /** Cách viết đuôi → số từ, nhiều nhất trước. */
  spellings: [string, number][]
}

/** Đếm trong bộ luyện: mỗi mẹo khớp bao nhiêu từ, các từ đó viết đuôi thế nào. */
export function tipStats(items: DictationItem[]): Map<string, TipStats> {
  const words = new Map<string, string[]>()
  const counts = new Map<string, Map<string, number>>()
  for (const item of items) {
    for (const { tip, spelling } of tipsFor(item)) {
      words.set(tip.id, [...(words.get(tip.id) ?? []), item.word])
      const c = counts.get(tip.id) ?? new Map<string, number>()
      c.set(spelling, (c.get(spelling) ?? 0) + 1)
      counts.set(tip.id, c)
    }
  }
  const out = new Map<string, TipStats>()
  for (const tip of SPELLING_TIPS) {
    out.set(tip.id, {
      words: words.get(tip.id) ?? [],
      spellings: [...(counts.get(tip.id) ?? [])].sort((a, b) => b[1] - a[1]),
    })
  }
  return out
}
