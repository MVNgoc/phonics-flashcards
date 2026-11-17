/**
 * Sinh src/data/ruleWords.json: danh sách từ để trang Quy tắc sinh câu hỏi Áp dụng.
 *
 *   npm run build:rule-words   (chạy sau build:meanings)
 *
 * Lấy những từ vừa có phát âm (pronunciations.json) vừa có nghĩa (meanings.json):
 * có nghĩa trong từ điển là cách lọc đơn giản bỏ tên riêng, tên chữ cái, viết tắt
 * (ann, cee, mm). Bỏ thêm một ít từ tục. Ghi riêng ra file nhỏ để trang Quy tắc
 * không phải tải meanings.json (~3MB) chỉ để lọc.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src/data')

const BLOCKED = new Set([
  'arse', 'ass', 'asses', 'bastard', 'bastards', 'bitch', 'bitches', 'bollocks', 'cock', 'cocks', 'crap',
  'cunt', 'damn', 'dick', 'dicks', 'fag', 'fuck', 'fucked', 'fucking', 'goddamn', 'piss', 'pissed', 'prick',
  'pussy', 'shit', 'slut', 'tit', 'tits', 'twat', 'wank', 'whore',
])

const prons = JSON.parse(readFileSync(join(DATA, 'pronunciations.json'), 'utf8')) as Record<string, string[]>
const meanings = JSON.parse(readFileSync(join(DATA, 'meanings.json'), 'utf8')) as Record<string, unknown>

const words = Object.keys(meanings)
  .filter((w) => /^[a-z]+$/.test(w) && prons[w] && !BLOCKED.has(w))
  .sort()

writeFileSync(join(DATA, 'ruleWords.json'), JSON.stringify(words))
console.log(`ruleWords.json: ${words.length} từ`)
