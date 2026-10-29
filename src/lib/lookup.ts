import type { AppData, Grapheme, Phoneme } from './types'

export interface LookupHit {
  phoneme: Phoneme
  grapheme: Grapheme
}

export interface LookupResult {
  /** Trường hợp viết đúng y như chữ tra. */
  exact: LookupHit[]
  /** Trường hợp có chứa chữ tra, vd tra "igh" ra cả "eigh", "aigh". */
  related: LookupHit[]
}

/** Chuẩn hoá chữ người dùng gõ để tra: bỏ khoảng trắng, không phân biệt hoa thường, "a_e" = "a-e". */
export function normalizeQuery(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/_/g, '-')
}

/** Phần dùng để tra của một trường hợp: bỏ chú thích trong ngoặc, vd "wr (w câm)" → "wr". */
export function spellingKey(spelling: string): string {
  return normalizeQuery(spelling.replace(/\([^)]*\)/g, ''))
}

/** Tra ngược: chữ / cặp chữ này tạo ra những âm nào. Giữ nguyên thứ tự âm trong data. */
export function lookupSpelling(data: AppData, query: string): LookupResult {
  const q = normalizeQuery(query)
  const result: LookupResult = { exact: [], related: [] }
  if (!q) return result
  for (const phoneme of data.phonemes) {
    for (const grapheme of phoneme.graphemes) {
      const key = spellingKey(grapheme.spelling)
      if (key === q) result.exact.push({ phoneme, grapheme })
      else if (key.includes(q)) result.related.push({ phoneme, grapheme })
    }
  }
  // Cách viết ngắn (gần với chữ tra hơn) lên trước; sort ổn định nên vẫn giữ thứ tự âm.
  result.related.sort((a, b) => spellingKey(a.grapheme.spelling).length - spellingKey(b.grapheme.spelling).length)
  return result
}

/** Mọi cách viết có trong data (đã bỏ chú thích, không trùng), để gợi ý khi gõ. */
export function allSpellingKeys(data: AppData): string[] {
  const keys = new Set<string>()
  for (const p of data.phonemes) for (const g of p.graphemes) keys.add(spellingKey(g.spelling))
  keys.delete('')
  return [...keys].sort()
}

export interface Segment {
  text: string
  hit: boolean
}

/**
 * Cắt ví dụ thành các đoạn để tô phần chữ tạo ra âm, vd "happy" + "y" → hap|py|.
 * Liền nhau ("igh") thì tô chỗ xuất hiện đầu tiên; tách đôi ("a-e") thì tô cặp
 * nguyên âm – một phụ âm – e cuối cùng (face, delete). Không tìm thấy thì không tô.
 */
export function highlightExample(word: string, spelling: string): Segment[] {
  const key = spellingKey(spelling)
  const lower = word.toLowerCase()
  const split = /^([a-z]+)-([a-z]+)$/.exec(key)

  if (split) {
    const [, head, tail] = split
    const re = new RegExp(`${head}[^aeiou\\s-]${tail}`, 'g')
    let last: RegExpExecArray | null = null
    for (let m = re.exec(lower); m; m = re.exec(lower)) {
      last = m
      re.lastIndex = m.index + 1
    }
    if (!last) return [{ text: word, hit: false }]
    const i = last.index
    const j = i + head.length + 1
    return [
      { text: word.slice(0, i), hit: false },
      { text: word.slice(i, i + head.length), hit: true },
      { text: word.slice(i + head.length, j), hit: false },
      { text: word.slice(j, j + tail.length), hit: true },
      { text: word.slice(j + tail.length), hit: false },
    ].filter((s) => s.text)
  }

  const i = key ? lower.indexOf(key) : -1
  if (i === -1) return [{ text: word, hit: false }]
  return [
    { text: word.slice(0, i), hit: false },
    { text: word.slice(i, i + key.length), hit: true },
    { text: word.slice(i + key.length), hit: false },
  ].filter((s) => s.text)
}

// ---------- tra theo âm ----------

/** Khoá so khớp tên âm: bỏ dấu "/", khoảng trắng, hoa thường. "Short /oo/" → "shortoo", "/ai/" → "ai". */
export function soundKey(label: string): string {
  return normalizeQuery(label).replace(/\//g, '')
}

/** Phần nằm giữa hai dấu "/" của tên âm, vd "Short /oo/" → "oo". Không có thì là cả khoá. */
export function soundCore(label: string): string {
  const m = /\/([^/]+)\//.exec(label)
  return m ? soundKey(m[1]) : soundKey(label)
}

export interface SoundLookupResult {
  /** Âm có tên trùng chữ tra; "oo" ra cả Short /oo/ lẫn Long /oo/. */
  exact: Phoneme[]
  /** Âm có tên chứa chữ tra, vd tra "ai" ra thêm /air/. */
  related: Phoneme[]
}

/** Tra xuôi: âm này có những cách viết nào. Giữ nguyên thứ tự âm trong data. */
export function lookupSound(data: AppData, query: string): SoundLookupResult {
  const q = soundKey(query)
  const result: SoundLookupResult = { exact: [], related: [] }
  if (!q) return result
  for (const p of data.phonemes) {
    const key = soundKey(p.note ?? '')
    if (!key) continue
    if (key === q || soundCore(p.note ?? '') === q) result.exact.push(p)
    else if (key.includes(q)) result.related.push(p)
  }
  result.related.sort((a, b) => soundKey(a.note ?? '').length - soundKey(b.note ?? '').length)
  return result
}

// ---------- tìm âm ở trang Quản lý ----------

/**
 * Lọc âm theo chữ tìm: khớp khi tên âm hoặc một cách viết có chứa chữ tìm.
 * Gõ có dấu "/" là tìm theo tên âm nên bỏ qua cách viết, và chỉ so với phần
 * giữa hai dấu "/" của tên (bỏ chữ "Short", "Long"): gõ đủ hai dấu (vd "/s/")
 * thì chỉ lấy âm trùng tên, gõ một dấu (vd "/s") thì lấy cả âm có tên chứa chữ tìm.
 * Âm trùng tên đứng đầu, rồi đến âm có tên chứa chữ tìm, cuối cùng là âm chỉ
 * khớp ở cách viết; trong mỗi nhóm giữ thứ tự data.
 * Chữ tìm rỗng thì trả lại nguyên danh sách.
 */
export function filterPhonemes(phonemes: Phoneme[], query: string): Phoneme[] {
  const q = soundKey(query)
  if (!q) return phonemes
  const slashes = query.split('/').length - 1
  const nameOnly = slashes > 0
  const rank = (p: Phoneme): number => {
    const key = soundKey(p.note ?? '')
    const core = soundCore(p.note ?? '')
    if (key && (core === q || (!nameOnly && key === q))) return 0
    if (slashes >= 2) return -1
    if ((nameOnly ? core : key).includes(q)) return 1
    if (!nameOnly && p.graphemes.some((g) => spellingKey(g.spelling).includes(q))) return 2
    return -1
  }
  return phonemes
    .map((p) => ({ p, r: rank(p) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p)
}
