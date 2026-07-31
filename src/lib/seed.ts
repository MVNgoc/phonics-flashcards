import type { AppData, Phoneme, PhonemeType } from './types'
import { newReviewState } from './sm2'

type SeedSpec = [label: string, type: PhonemeType, graphemes: [string, string[]][]]

const SEED: SeedSpec[] = [
  [
    '/æ/',
    'vowel',
    [
      ['a', ['cat', 'hat', 'map']],
      ['ai', ['plaid']],
    ],
  ],
  [
    '/iː/',
    'vowel',
    [
      ['ee', ['see', 'tree']],
      ['ea', ['eat', 'sea']],
      ['ie', ['field', 'chief']],
      ['y', ['happy', 'city']],
    ],
  ],
  [
    '/ɪ/',
    'vowel',
    [
      ['i', ['sit', 'big']],
      ['y', ['gym', 'myth']],
      ['ui', ['build']],
    ],
  ],
  [
    '/oʊ/',
    'vowel',
    [
      ['o', ['go', 'no']],
      ['oa', ['boat', 'coat']],
      ['ow', ['snow', 'slow']],
      ['oe', ['toe']],
    ],
  ],
  [
    '/ɜːr/',
    'vowel',
    [
      ['er', ['her', 'term']],
      ['ir', ['bird', 'girl']],
      ['ur', ['turn', 'burn']],
      ['ear', ['learn', 'earth']],
    ],
  ],
  [
    '/k/',
    'consonant',
    [
      ['c', ['cat', 'cup']],
      ['k', ['kite', 'kid']],
      ['ck', ['duck', 'kick']],
      ['ch', ['school', 'echo']],
    ],
  ],
  [
    '/f/',
    'consonant',
    [
      ['f', ['fan', 'fish']],
      ['ph', ['phone', 'graph']],
      ['gh', ['laugh', 'cough']],
    ],
  ],
  [
    '/ʃ/',
    'consonant',
    [
      ['sh', ['ship', 'fish']],
      ['ti', ['nation', 'station']],
      ['ci', ['special', 'social']],
      ['ch', ['machine', 'chef']],
    ],
  ],
  [
    '/dʒ/',
    'consonant',
    [
      ['j', ['jam', 'jump']],
      ['g', ['giant', 'gym']],
      ['dge', ['bridge', 'judge']],
      ['ge', ['large', 'page']],
    ],
  ],
  ['/θ/', 'consonant', [['th', ['think', 'bath', 'three']]]],
]

export function seedData(): AppData {
  const phonemes: Phoneme[] = SEED.map(([note, type, graphemes], i) => ({
    id: `seed-p${i}`,
    type,
    note,
    graphemes: graphemes.map(([spelling, examples], j) => ({
      id: `seed-p${i}-g${j}`,
      spelling,
      examples,
      review: newReviewState(),
    })),
  }))
  return { phonemes }
}
