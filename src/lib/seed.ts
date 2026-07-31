import type { AppData, Phoneme, PhonemeType } from './types'
import { newReviewState } from './sm2'

type SeedSpec = [note: string, type: PhonemeType, graphemes: [string, string[]][]]

const SEED: SeedSpec[] = [
  [
    'a ngắn (cat)',
    'vowel',
    [
      ['a', ['cat', 'hat', 'map']],
      ['ai', ['plaid']],
    ],
  ],
  [
    'i dài (see)',
    'vowel',
    [
      ['ee', ['see', 'tree']],
      ['ea', ['eat', 'sea']],
      ['ie', ['field', 'chief']],
      ['y', ['happy', 'city']],
    ],
  ],
  [
    'i ngắn (sit)',
    'vowel',
    [
      ['i', ['sit', 'big']],
      ['y', ['gym', 'myth']],
      ['ui', ['build']],
    ],
  ],
  [
    'ô đôi (go)',
    'vowel',
    [
      ['o', ['go', 'no']],
      ['oa', ['boat', 'coat']],
      ['ow', ['snow', 'slow']],
      ['oe', ['toe']],
    ],
  ],
  [
    'ơ + r (her)',
    'vowel',
    [
      ['er', ['her', 'term']],
      ['ir', ['bird', 'girl']],
      ['ur', ['turn', 'burn']],
      ['ear', ['learn', 'earth']],
    ],
  ],
  [
    'âm k (cat)',
    'consonant',
    [
      ['c', ['cat', 'cup']],
      ['k', ['kite', 'kid']],
      ['ck', ['duck', 'kick']],
      ['ch', ['school', 'echo']],
    ],
  ],
  [
    'âm f (fan)',
    'consonant',
    [
      ['f', ['fan', 'fish']],
      ['ph', ['phone', 'graph']],
      ['gh', ['laugh', 'cough']],
    ],
  ],
  [
    'âm sh (ship)',
    'consonant',
    [
      ['sh', ['ship', 'fish']],
      ['ti', ['nation', 'station']],
      ['ci', ['special', 'social']],
      ['ch', ['machine', 'chef']],
    ],
  ],
  [
    'âm j (jam)',
    'consonant',
    [
      ['j', ['jam', 'jump']],
      ['g', ['giant', 'gym']],
      ['dge', ['bridge', 'judge']],
      ['ge', ['large', 'page']],
    ],
  ],
  ['âm th không rung (think)', 'consonant', [['th', ['think', 'bath', 'three']]]],
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
