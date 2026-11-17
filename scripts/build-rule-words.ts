// Sinh src/data/ruleWords.json (từ có cả phát âm lẫn nghĩa). Chạy sau build:meanings.
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
