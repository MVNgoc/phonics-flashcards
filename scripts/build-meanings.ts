/**
 * Sinh src/data/meanings.json: nghĩa tiếng Việt cho mọi từ trong pronunciations.json,
 * hiện ở trang Nghe khi xem đáp án.
 *
 *   npm run build:meanings   (chạy sau build:pron)
 *
 * Nguồn: mục từ tiếng Anh của Wiktionary tiếng Việt (CC BY-SA), bản trích xuất
 * JSONL của kaikki.org (~115MB, tải về scripts/.cache).
 *
 * Mỗi từ loại giữ tối đa MAX_SENSES nghĩa đầu. Dạng chia có mục riêng chỉ ghi
 * "Số nhiều của boundary" thì lấy nghĩa của từ gốc và giữ câu đó làm ghi chú; dạng
 * chia không có mục (accessed, adults) thì bỏ đuôi -s/-ed/-ing để tìm từ gốc.
 *
 * Định dạng: { "nose": [{ "pos": "danh từ", "senses": ["Mũi (người); mõm (súc vật)", ...] }, ...],
 *              "boundaries": [{ "pos": "danh từ", "senses": [...], "of": "Số nhiều của boundary" }] }
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'scripts/.cache')
const SOURCE =
  'https://kaikki.org/viwiktionary/Ti%E1%BA%BFng%20Anh/kaikki.org-dictionary-Ti%E1%BA%BFngAnh.jsonl'
const MAX_SENSES = 3

/** Nghĩa chỉ trỏ sang từ gốc: "Số nhiều của boundary", "Quá khứ và phân từ quá khứ của promote". */
const FORM_OF = /^((?:Động từ chia|Dạng|Quá khứ|Số nhiều|[Pp]hân từ|so sánh|Đồng nghĩa)[^.]* của) ([a-z][a-z'-]*)$/

interface Entry {
  pos: string
  glosses: string[]
}

interface Meaning {
  pos: string
  senses: string[]
  of?: string
}

async function download(): Promise<string> {
  const file = join(CACHE, 'viwiktionary-en.jsonl')
  if (!existsSync(file)) {
    mkdirSync(CACHE, { recursive: true })
    const res = await fetch(SOURCE)
    if (!res.ok) throw new Error(`Tải Wiktionary lỗi: ${res.status}`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
  }
  return file
}

async function readEntries(file: string): Promise<Map<string, Entry[]>> {
  const entries = new Map<string, Entry[]>()
  for await (const line of createInterface({ input: createReadStream(file) })) {
    if (!line) continue
    const e = JSON.parse(line) as { word: string; pos_title?: string; pos: string; senses?: { glosses?: string[] }[] }
    const glosses = (e.senses ?? []).flatMap((s) => s.glosses ?? []).map(clean).filter(Boolean)
    if (!glosses.length) continue
    const word = e.word.toLowerCase()
    entries.set(word, [...(entries.get(word) ?? []), { pos: (e.pos_title ?? e.pos).toLowerCase(), glosses }])
  }
  return entries
}

const clean = (gloss: string) => gloss.trim().replace(/\.$/, '')

/**
 * Từ gốc có thể có của một dạng chia: accessed → access, studies → study, stopped →
 * stop. `verb`: đuôi -ed/-ing nên chỉ lấy nghĩa động từ của từ gốc (nếu có).
 */
function inflectionBases(word: string): { base: string; verb: boolean }[] {
  const out: { base: string; verb: boolean }[] = []
  const rules: [RegExp, string, boolean][] = [
    [/ies$/, 'y', false], [/es$/, '', false], [/s$/, '', false],
    [/ied$/, 'y', true], [/ed$/, '', true], [/ed$/, 'e', true], [/d$/, '', true],
    [/ing$/, '', true], [/ing$/, 'e', true],
  ]
  for (const [re, rep, verb] of rules) if (re.test(word)) out.push({ base: word.replace(re, rep), verb })
  for (const { base, verb } of [...out]) {
    if (/([b-df-hj-np-tv-z])\1$/.test(base)) out.push({ base: base.slice(0, -1), verb })
  }
  return out.filter(({ base }) => base.length > 1)
}

/** Nội/ngoại động từ tính chung là động từ khi so từ loại của dạng chia với từ gốc. */
const posFamily = (pos: string) => (pos.includes('động từ') ? 'động từ' : pos)

/** Nghĩa của từ gốc, ưu tiên đúng từ loại; không có từ loại đó thì lấy hết. */
function baseMeanings(entries: Entry[], pos: string | null, of: string): Meaning[] {
  const all = ownMeanings(entries)
  const same = pos ? all.filter((m) => posFamily(m.pos) === posFamily(pos)) : []
  return (same.length ? same : all).map((m) => ({ ...m, of }))
}

/** Nghĩa riêng của từ (bỏ các dòng chỉ trỏ sang từ gốc), gộp theo từ loại. */
function ownMeanings(entries: Entry[]): Meaning[] {
  const byPos = new Map<string, string[]>()
  for (const { pos, glosses } of entries) {
    const list = byPos.get(pos) ?? []
    for (const g of glosses) if (!FORM_OF.test(g) && !list.includes(g)) list.push(g)
    byPos.set(pos, list)
  }
  return [...byPos]
    .filter(([, senses]) => senses.length)
    .map(([pos, senses]) => ({ pos, senses: senses.slice(0, MAX_SENSES) }))
}

function meaningsOf(word: string, entries: Map<string, Entry[]>): Meaning[] {
  const own = entries.get(word)
  if (own) {
    const result = ownMeanings(own)
    // Dạng chia có mục riêng: nối nghĩa của từ gốc vào.
    for (const { pos, glosses } of own) {
      const m = glosses.map((g) => FORM_OF.exec(g)).find(Boolean)
      const base = m && entries.get(m[2].toLowerCase())
      if (!m || !base) continue
      for (const meaning of baseMeanings(base, pos, `${m[1]} ${m[2]}`)) {
        if (!result.some((r) => r.pos === meaning.pos)) result.push(meaning)
      }
    }
    if (result.length) return result
  }
  for (const { base, verb } of inflectionBases(word)) {
    const found = entries.get(base)
    const result = found ? baseMeanings(found, verb ? 'động từ' : null, `Dạng của ${base}`) : []
    if (result.length) return result
  }
  return []
}

async function main() {
  const entries = await readEntries(await download())
  const words = Object.keys(JSON.parse(readFileSync(join(ROOT, 'src/data/pronunciations.json'), 'utf8')))
  const out: Record<string, Meaning[]> = {}
  for (const word of words) {
    const meanings = meaningsOf(word, entries)
    if (meanings.length) out[word] = meanings
  }
  writeFileSync(join(ROOT, 'src/data/meanings.json'), JSON.stringify(out))

  const practice = JSON.parse(readFileSync(join(ROOT, 'src/data/practiceWords.json'), 'utf8')) as string[]
  const practiceHits = practice.filter((w) => out[w]).length
  console.log(`meanings.json: ${Object.keys(out).length}/${words.length} từ có nghĩa`)
  console.log(`từ luyện có nghĩa: ${practiceHits}/${practice.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
