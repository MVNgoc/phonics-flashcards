import type { AppData, Phoneme, PhonemeType } from './types'
import { newReviewState } from './sm2'

type SeedSpec = [ipa: string, type: PhonemeType, note: string, graphemes: [string, string[]][]]

const SEED: SeedSpec[] = [
  [
    '/æ/',
    'vowel',
    'Nguyên âm ngắn, miệng mở rộng',
    [
      ['a', ['cat', 'hat', 'map']],
      ['ai', ['plaid']],
    ],
  ],
  [
    '/iː/',
    'vowel',
    'Nguyên âm dài',
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
    'Nguyên âm ngắn',
    [
      ['i', ['sit', 'big']],
      ['y', ['gym', 'myth']],
      ['ui', ['build']],
    ],
  ],
  [
    '/oʊ/',
    'vowel',
    'Nguyên âm đôi',
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
    'Nguyên âm + r',
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
    'Phụ âm tắc, vô thanh',
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
    'Phụ âm xát, vô thanh',
    [
      ['f', ['fan', 'fish']],
      ['ph', ['phone', 'graph']],
      ['gh', ['laugh', 'cough']],
    ],
  ],
  [
    '/ʃ/',
    'consonant',
    'Phụ âm xát, vô thanh',
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
    'Phụ âm tắc-xát, hữu thanh',
    [
      ['j', ['jam', 'jump']],
      ['g', ['giant', 'gym']],
      ['dge', ['bridge', 'judge']],
      ['ge', ['large', 'page']],
    ],
  ],
  [
    '/θ/',
    'consonant',
    'Phụ âm xát, vô thanh (th không rung)',
    [
      ['th', ['think', 'bath', 'three']],
    ],
  ],
]

export function seedData(): AppData {
  const phonemes: Phoneme[] = SEED.map(([ipa, type, note, graphemes], i) => ({
    id: `seed-p${i}`,
    ipa,
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
