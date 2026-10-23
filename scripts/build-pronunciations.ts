/**
 * Sinh dữ liệu cho trang Nghe:
 * - src/data/pronunciations.json: phát âm giọng Anh.
 * - src/data/practiceWords.json: từ trong từ điển đưa thêm vào bộ luyện (ngoài từ
 *   ví dụ trong bảng) — từ 2 âm tiết trở lên, chính tả Anh-Anh, đã bỏ tên riêng và
 *   từ tục.
 *
 *   npm run build:pron
 *
 * Nguồn:
 * 1. Britfone (MIT, ~16k từ, giọng Anh, IPA có dấu nhấn) — lấy hết.
 * 2. CMU Pronouncing Dictionary (giọng Mỹ) — chỉ lấy những từ ví dụ trong seed mà
 *    Britfone không có, đổi ARPAbet sang IPA kiểu Anh (bỏ r sau nguyên âm...).
 *
 * File tải về nằm ở scripts/.cache (gitignore). Định dạng đầu ra:
 * { "daughter": ["d ˈɔː t ə"], ... } — mỗi phát âm là các âm cách nhau bằng dấu
 * cách, nguyên âm nhấn chính có tiền tố ˈ, nhấn phụ ˌ.
 *
 * Lọc từ luyện cần /usr/share/dict/words (có sẵn trên macOS): từ có ở đó dạng viết
 * thường (hoặc từ gốc sau khi bỏ -s/-ed/-ing... có ở đó) mới giữ. Từ chỉ có dạng
 * viết hoa (London, Yugoslavia) và tên người trong /usr/share/dict/propernames bị bỏ.
 *
 * Chính tả Anh-Anh theo VarCon (SCOWL, Kevin Atkinson): từ chỉ là cách viết Mỹ
 * (color, center, organize) bị bỏ, cách viết Anh (colour, centre, organise) được
 * giữ — kể cả khi /usr/share/dict/words (từ điển Mỹ) không có nó.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { builtinSeedData } from '../src/lib/seed'
import { exampleWords } from '../src/lib/dictation'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'scripts/.cache')
const SYSTEM_WORDS = '/usr/share/dict/words'
const SYSTEM_NAMES = '/usr/share/dict/propernames'

/** Từ tục / nhạy cảm không đưa vào bộ luyện (so với từ gốc). Từ ví dụ trong bảng không bị lọc. */
const BLOCKLIST = new Set([
  'arse', 'arsehole', 'asshole', 'bastard', 'bitch', 'bollocks', 'boob', 'cock', 'crap', 'cunt',
  'damn', 'dick', 'dildo', 'erotic', 'fag', 'faggot', 'fuck', 'fucker', 'goddamn', 'horny', 'masturbation',
  'nigger', 'nude', 'orgasm', 'penis', 'piss', 'porn', 'porno', 'pornography', 'pussy', 'rape', 'rapist',
  'sexy', 'shit', 'shitty', 'slut', 'tits', 'upskirt', 'vagina', 'wank', 'wanker', 'whore',
])

const SOURCES = {
  britfone: 'https://raw.githubusercontent.com/JoseLlarena/Britfone/master/britfone.main.3.0.1.csv',
  cmu: 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict',
  varcon: 'https://raw.githubusercontent.com/en-wl/wordlist/master/varcon/varcon.txt',
}

async function download(name: keyof typeof SOURCES): Promise<string> {
  const file = join(CACHE, name + '.txt')
  if (!existsSync(file)) {
    mkdirSync(CACHE, { recursive: true })
    const res = await fetch(SOURCES[name])
    if (!res.ok) throw new Error(`Tải ${name} lỗi: ${res.status}`)
    writeFileSync(file, await res.text())
  }
  return readFileSync(file, 'utf8')
}

function add(map: Map<string, string[]>, word: string, pron: string) {
  const list = map.get(word) ?? []
  if (!list.includes(pron)) list.push(pron)
  map.set(word, list)
}

const VOWELS: Record<string, string> = {
  AE: 'æ', AW: 'aʊ', AY: 'aɪ', EY: 'eɪ', OW: 'əʊ', OY: 'ɔɪ', UW: 'uː', UH: 'ʊ', EH: 'ɛ', IH: 'ɪ', AO: 'ɔː',
}
const CONSONANTS: Record<string, string> = {
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'g', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n',
  NG: 'ŋ', P: 'p', S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
}
/** Nguyên âm + R (không có nguyên âm theo sau) → nguyên âm dài kiểu Anh. */
const R_COLOURED: Record<string, string> = { AA: 'ɑː', AO: 'ɔː', EH: 'ɛə', IH: 'ɪə', IY: 'ɪə', UH: 'ʊə', UW: 'ʊə' }

/** ARPAbet (CMU) → IPA kiểu Britfone. Gần đúng: LOT luôn thành ɒ, nên "father" sẽ sai. */
export function cmuToBritish(arpabet: string[]): string {
  const out: string[] = []
  const isVowel = (p?: string) => !!p && /\d$/.test(p)
  for (let k = 0; k < arpabet.length; k++) {
    const m = /^([A-Z]+)(\d)?$/.exec(arpabet[k])
    if (!m) throw new Error('Âm lạ: ' + arpabet[k])
    const [, base, digit] = m
    const mark = digit === '1' ? 'ˈ' : digit === '2' ? 'ˌ' : ''
    if (base === 'R') {
      // r sau nguyên âm đã gộp vào nguyên âm trước nó; chỉ đọc khi có nguyên âm theo sau.
      if (isVowel(arpabet[k - 1]) && !isVowel(arpabet[k + 1])) continue
      out.push('ɹ')
      continue
    }
    if (!digit) {
      out.push(CONSONANTS[base] ?? base.toLowerCase())
      continue
    }
    const nextR = arpabet[k + 1] === 'R'
    let v: string
    if (base === 'ER') v = digit === '0' ? 'ə' : 'ɜː'
    else if (nextR && R_COLOURED[base]) v = R_COLOURED[base]
    else if (base === 'AH') v = digit === '0' ? 'ə' : 'ɐ'
    else if (base === 'AA') v = 'ɒ'
    else if (base === 'IY') v = digit === '0' && k === arpabet.length - 1 ? 'i' : 'iː'
    else v = VOWELS[base]
    out.push(mark + v)
  }
  return out.join(' ')
}

async function main() {
  const prons = new Map<string, string[]>()

  for (const line of (await download('britfone')).split('\n')) {
    const m = /^([A-Z'-]+)(?:\(\d+\))?,\s*(.+)$/.exec(line.trim())
    if (!m || m[1].startsWith("'")) continue
    add(prons, m[1].toLowerCase(), m[2].trim().replace(/\s+/g, ' '))
  }
  const fromBritfone = prons.size

  const cmu = new Map<string, string[][]>()
  for (const line of (await download('cmu')).split('\n')) {
    const m = /^([a-z'-]+)(?:\(\d+\))? ([^#]+)/.exec(line)
    if (!m) continue
    cmu.set(m[1], [...(cmu.get(m[1]) ?? []), m[2].trim().split(' ')])
  }

  const missing: string[] = []
  let fromCmu = 0
  for (const word of exampleWords(builtinSeedData().phonemes)) {
    if (prons.has(word)) continue
    const list = cmu.get(word)
    if (!list) {
      missing.push(word)
      continue
    }
    for (const p of list) add(prons, word, cmuToBritish(p))
    fromCmu++
  }

  const sorted = Object.fromEntries([...prons].sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(join(ROOT, 'src/data/pronunciations.json'), JSON.stringify(sorted) + '\n')
  console.log(`Britfone ${fromBritfone} từ · CMU bù ${fromCmu} từ ví dụ · không có phát âm: ${missing.length}`)
  if (missing.length) console.log('  ' + missing.join(', '))

  const practice = practiceWords(sorted, parseVarcon(await download('varcon')))
  writeFileSync(join(ROOT, 'src/data/practiceWords.json'), JSON.stringify(practice) + '\n')
  console.log(`Từ luyện thêm từ từ điển: ${practice.length}`)
}

/** Dạng gốc có thể có của một từ: "churches" → church, "studied" → study... */
function stems(word: string): string[] {
  const out = [word]
  const rules: [RegExp, string][] = [
    [/ies$/, 'y'], [/es$/, ''], [/s$/, ''], [/ied$/, 'y'], [/ed$/, ''], [/ed$/, 'e'],
    [/ing$/, ''], [/ing$/, 'e'], [/er$/, ''], [/er$/, 'e'], [/est$/, ''], [/ly$/, ''],
  ]
  for (const [re, rep] of rules) if (re.test(word)) out.push(word.replace(re, rep))
  // nhân đôi phụ âm: stopped → stop, running → run
  for (const s of [...out]) if (/([b-df-hj-np-tv-z])\1$/.test(s)) out.push(s.slice(0, -1))
  return out
}

const VOWEL_RE = /[æɑɛɪiɒɔɐəʊuɜ]/

interface Varcon {
  /** Cách viết dùng ở Anh (nhãn B, kể cả Bv). */
  british: Set<string>
  /** Cách viết có trong VarCon nhưng ở dòng nào cũng không có nhãn B: chỉ là kiểu Mỹ (hoặc -ize). */
  notBritish: Set<string>
  /** Cách viết Anh → cách viết Mỹ cùng dòng (colour → color), để tra từ điển Mỹ. */
  americanOf: Map<string, string[]>
}

/**
 * Dòng VarCon: "A Cv DV: color / B C D: colour | ghi chú". Nhãn A = Mỹ, B = Anh
 * (-ise), Z = Anh -ize / OED; chữ thường theo sau (v, V...) là biến thể ít dùng.
 */
function parseVarcon(text: string): Varcon {
  const british = new Set<string>()
  const other = new Set<string>()
  const americanOf = new Map<string, string[]>()
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue
    const parts = line.split('|')[0].split(' / ').map((part) => {
      const [tags, word] = part.split(':').map((x) => x.trim())
      return { tags: tags.split(/\s+/), word: word?.toLowerCase() ?? '' }
    })
    const american = parts.filter((p) => p.tags.some((t) => t.startsWith('A'))).map((p) => p.word)
    for (const { tags, word } of parts) {
      if (!/^[a-z]+$/.test(word)) continue
      if (tags.some((t) => t.startsWith('B'))) {
        british.add(word)
        americanOf.set(word, [...(americanOf.get(word) ?? []), ...american])
      } else other.add(word)
    }
  }
  return { british, notBritish: new Set([...other].filter((w) => !british.has(w))), americanOf }
}

function practiceWords(prons: Record<string, string[]>, varcon: Varcon): string[] {
  if (!existsSync(SYSTEM_WORDS)) throw new Error(`Cần ${SYSTEM_WORDS} để lọc tên riêng (có sẵn trên macOS)`)
  const lines = readFileSync(SYSTEM_WORDS, 'utf8').split('\n')
  const lower = new Set(lines.filter((w) => /^[a-z]+$/.test(w)))
  const names = new Set(
    existsSync(SYSTEM_NAMES) ? readFileSync(SYSTEM_NAMES, 'utf8').split('\n').map((w) => w.toLowerCase()) : [],
  )
  return Object.keys(prons).filter((word) => {
    if (!/^[a-z]{3,}$/.test(word) || names.has(word)) return false
    const syllables = prons[word][0].split(' ').filter((t) => VOWEL_RE.test(t)).length
    if (syllables < 2) return false
    if (varcon.notBritish.has(word)) return false
    const roots = stems(word)
    if (roots.some((r) => BLOCKLIST.has(r))) return false
    // Từ điển hệ thống là từ điển Mỹ: từ viết kiểu Anh thì tra bằng cách viết Mỹ của nó.
    const lookups = [word, ...(varcon.americanOf.get(word) ?? [])].flatMap(stems)
    return lookups.some((r) => lower.has(r))
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
