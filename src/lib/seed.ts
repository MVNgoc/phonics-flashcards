import type { AppData, Phoneme, PhonemeType, StoredState } from './types'
import { newReviewState } from './sm2'

type SeedSpec = [label: string, type: PhonemeType, graphemes: [string, string[]][]]

/**
 * Bộ âm do người dùng soạn. Quy ước:
 * - nhãn (phần tử đầu) là đề bài hiện lên khi học, phải là duy nhất
 * - trong cùng một âm, không được có hai trường hợp trùng tên (xem seed.test.ts)
 */
const SEED: SeedSpec[] = [
  // ---------- nguyên âm ----------
  ['/a/', 'vowel', [['a', ['cat', 'hat', 'map', 'tab', 'bag', 'back']]]],
  [
    '/e/',
    'vowel',
    [
      ['e', ['net', 'ret', 'ten', 'test', 'bed', 'lend']],
      ['ea', ['bread', 'head', 'health', 'weather', 'ready', 'sweat']],
      ['ai', ['again', 'said', 'against']],
    ],
  ],
  [
    '/i/',
    'vowel',
    [
      ['i', ['ship', 'hit', 'lips', 'pin', 'cliff', 'chips']],
      ['y', ['happy', 'lovely', 'monopoly', 'daily', 'typical']],
    ],
  ],
  [
    '/o/',
    'vowel',
    [
      ['o', ['hot', 'stop', 'top', 'on', 'off', 'long']],
      ['a', ['water', 'wash', 'watch', 'want', 'quantity']],
    ],
  ],
  [
    '/u/',
    'vowel',
    [
      ['u', ['gun', 'run', 'study', 'but', 'much', 'sun']],
      ['o', ['monday', 'love', 'of', 'son', 'colour', 'from']],
      ['ou', ['rough', 'tough', 'touch', 'young', 'country', 'double']],
      ['oo', ['blood', 'flood']],
    ],
  ],
  [
    '/ai/',
    'vowel',
    [
      ['ai', ['rain', 'main', 'gain', 'spain', 'fail', 'pain']],
      ['ay', ['day', 'play', 'gay', 'maybe', 'clay', 'way']],
      ['a', ['paper', 'baby', 'table', 'lazy', 'gravy', 'crazy']],
      ['ae', ['Israel', 'sundae', 'brae', 'maelstrom', 'tael', 'baedeker']],
      ['a-e', ['face', 'state', 'late', 'take', 'ate', 'age']],
      ['ea', ['steak', 'great', 'break', 'breakfast']],
      ['ei', ['vein', 'veil', 'reindeer', 'rein', 'deign']],
      ['ey', ['they', 'prey', 'hey', 'grey', 'whey', 'survey']],
      ['eigh', ['weight', 'eight', 'neighbor', 'weigh', 'sleigh', 'freight']],
      ['aigh', ['straight']],
      ['et', ['buffet', 'fillet', 'ballet', 'bouquet', 'crochet', 'gourmet']],
    ],
  ],
  [
    '/ee/',
    'vowel',
    [
      ['ee', ['meet', 'seed', 'see', 'tree', 'bee', 'sweet']],
      ['ea', ['meat', 'cheat', 'mean', 'cheap', 'tee', 'beach']],
      ['e', ['email', 'eBay', 'he', 'she', 'we', 'me']],
      ['ei', ['ceiling', 'seize', 'receipt', 'receive', 'neither', 'either']],
      ['ey', ['money', 'key', 'honey', 'monkey', 'kidney', 'alley']],
      ['ie', ['shield', 'believe', 'piece', 'belief', 'relieve', 'thief']],
      ['i-e', ['machine', 'naive', 'sardines', 'marine', 'cuisine', 'routine']],
      ['e-e', ['complete', 'delete', 'these', 'evening', 'eve', 'meme']],
    ],
  ],
  [
    '/igh/',
    'vowel',
    [
      ['igh', ['light', 'night', 'might', 'tight', 'fight', 'right']],
      ['i', ['find', 'wifi', 'hi', 'mind', 'tiny', 'violin']],
      ['y', ['sky', 'why', 'my', 'fly', 'cry', 'shy']],
      ['ie', ['die', 'lie', 'tie', 'pie', 'cries', 'tries']],
      ['i-e', ['nice', 'wife', 'quite', 'life', 'rice', 'nine']],
      ['ei', ['either', 'neither', 'seismic', 'feisty', 'gneiss']],
    ],
  ],
  [
    '/oa/',
    'vowel',
    [
      ['oa', ['load', 'boat', 'loading', 'road', 'goat', 'goal']],
      ['ow', ['snow', 'slow', 'flow', 'low', 'grow', 'show']],
      ['o', ['open', 'old', 'gold', 'cold', 'hold', 'told']],
      ['oe', ['Joe', 'hoe', 'toe', 'foe', 'oboe', 'woe']],
      ['o-e', ['hope', 'code', 'close', 'note', 'nose', 'coke']],
      ['ough', ['although', 'dough', 'though', 'doughnut']],
      ['ou', ['soul', 'shoulder', 'mould', 'moult', 'boulder']],
      ['eau', ['bureau', 'beau', 'plateau', 'chateau', 'gateau', 'tableau']],
    ],
  ],
  [
    '/yoo/',
    'vowel',
    [
      ['u', ['student', 'human', 'music', 'university', 'future', 'unit']],
      ['ue', ['value', 'due', 'Tuesday', 'statue', 'rescue', 'cue']],
      ['u-e', ['use', 'huge', 'excuse', 'volume', 'tube', 'youtube']],
      ['ew', ['few', 'new', 'knew', 'view', 'review', 'nephew']],
      ['eu', ['Europe', 'Euro', 'neuron', 'neutron', 'deuce', 'neutral']],
    ],
  ],
  [
    'Short /oo/',
    'vowel',
    [
      ['oo', ['cook', 'look', 'book', 'good', 'foot']],
      ['ou', ['would', 'should', 'could']],
      ['u', ['put', 'push', 'pull', 'bull', 'bully', 'hull']],
      ['o', ['wolves', 'wolf', 'to']],
    ],
  ],
  [
    'Long /oo/',
    'vowel',
    [
      ['oo', ['balloon', 'zoo', 'soon', 'hood', 'shook', 'school']],
      ['ou', ['group', 'soup', 'would', 'troup', 'troupe']],
      ['u-e', ['include', 'June', 'rude', 'tune', 'flute', 'rule']],
      ['ue', ['glue', 'blue', 'sue', 'true', 'clue']],
      ['ew', ['crew', 'flew', 'threw', 'grew', 'drew', 'blew']],
      ['ui', ['juice', 'fruit', 'suit', 'bruise', 'cruise']],
      ['o-e', ['approve', 'move', 'lose', 'whose', 'improve', 'prove']],
      ['oe', ['shoes', 'canoe']],
      ['o', ['who', 'whom', 'do', 'tomb', 'womb']],
      ['u', ['flu', 'truth', 'ruby', 'tulip', 'rumour']],
      ['ough', ['through']],
    ],
  ],
  [
    '/oi/',
    'vowel',
    [
      ['oi', ['choice', 'coin', 'noisy', 'voice', 'oil', 'boil']],
      ['oy', ['boy', 'toy', 'deploy', 'joy', 'enjoy', 'destroy']],
    ],
  ],
  [
    '/ou/',
    'vowel',
    [
      ['ou', ['mouth', 'house', 'voucher', 'mouse', 'sound', 'loud']],
      ['ow', ['now', 'flower', 'how', 'wow', 'down', 'cow']],
      ['ough', ['drought', 'plough', 'bough', 'sough', 'slough']],
    ],
  ],
  [
    '/ar/',
    'vowel',
    [
      ['ar', ['garden', 'car', 'bar', 'far', 'dark', 'start']],
      ['a', ['father', 'palm', 'calf', 'halves', 'calm', 'half']],
    ],
  ],
  [
    '/or/',
    'vowel',
    [
      ['or', ['storm', 'or', 'form', 'nor', 'for', 'sorry']],
      ['oar', ['board', 'roar', 'soar', 'hoard', 'oars']],
      ['oor', ['floor', 'door', 'indoor', 'outdoor', 'moor']],
      ['ore', ['score', 'store', 'bore', 'more', 'adore', 'fore']],
      ['our', ['Pour', 'four', 'your', 'mourn', 'course', 'gourmet']],
      ['aw', ['law', 'draw', 'paw', 'raw', 'claw', 'saw']],
      ['au', ['august', 'audio', 'author', 'cause', 'because', 'sauce']],
      ['ar', ['war', 'warrior', 'award', 'reward', 'ward', 'toward']],
      ['augh', ['daughter', 'taught', 'caught', 'naughty']],
      ['ough', ['thought', 'fought', 'brought', 'sought', 'bought']],
    ],
  ],
  [
    '/ur/',
    'vowel',
    [
      // gộp hai lần khai "er" trong bảng gốc
      [
        'er',
        [
          'person',
          'mercy',
          'verb',
          'her',
          'version',
          'serve',
          'server',
          'letter',
          'remember',
          'member',
          'never',
          'paper',
        ],
      ],
      ['ir', ['girl', 'birth', 'birthday', 'sir', 'bird', 'circle']],
      ['ur', ['church', 'hurry', 'burn', 'turn', 'curse', 'hurt']],
      ['ear', ['learn', 'earn', 'search', 'research', 'early', 'Earth']],
      // gộp hai lần khai "or" trong bảng gốc
      [
        'or',
        [
          'work',
          'worry',
          'word',
          'world',
          'worm',
          'worse',
          'doctor',
          'color',
          'neighbor',
          'motor',
          'mirror',
          'actor',
        ],
      ],
      ['our', ['colour', 'favourite', 'neighbour', 'labour', 'flavour', 'favour']],
      ['re', ['theatre', 'kilometer', 'centimetre', 'future', 'picture', 'nature']],
      ['ar', ['sugar', 'dollar', 'collar', 'solar', 'polar', 'regular']],
    ],
  ],
  [
    '/air/',
    'vowel',
    [
      ['air', ['chair', 'hair', 'stair', 'air', 'airline', 'airport']],
      ['are', ['care', 'share', 'rare', 'dare', 'scare', 'square']],
      ['aer', ['aerobic', 'aero', 'aerial', 'aerate', 'aerie', 'aeronautic']],
      ['ear', ['wear', 'bear', 'pear', 'tear']],
      ['ere', ['there', 'where']],
      ['eir', ['heir', 'their']],
    ],
  ],
  [
    '/eer/',
    'vowel',
    [
      ['eer', ['cheer', 'engineer', 'volunteer', 'deer', 'beer', 'peer']],
      ['ear', ['near', 'year', 'hear', 'gear', 'fear', 'tear']],
      ['ere', ['atmosphere', 'here', 'severe', 'mere', 'interfere', 'sincere']],
      ['ier', ['premier', 'tier', 'frontier', 'cashier', 'fierce', 'pierce']],
      ['er', ['hero', 'zero', 'cereal', 'serial', 'serious', 'serum']],
    ],
  ],
  [
    '/oor/',
    'vowel',
    [
      ['oor', ['boorish', 'poor', 'roorback']],
      ['ure', ['ensure', 'sure', 'mature']],
      ['our', ['tourist', 'tour', 'tourism', 'amour', 'tourguide']],
    ],
  ],
  ['/yoor/', 'vowel', [['ure', ['pure', 'cure', 'secure', 'endure', 'endurance', 'during']]]],

  // ---------- phụ âm ----------
  [
    '/b/',
    'consonant',
    [
      ['b', ['beer', 'bus', 'been', 'boy', 'beat', 'bug']],
      ['bb', ['bubble', 'hobby', 'chubby', 'rabbit', 'lobby', 'rubble']],
      ['bu', ['buy', 'build', 'built', 'building', 'buoy']],
    ],
  ],
  [
    '/k/',
    'consonant',
    [
      ['k', ['key', 'kick', 'kill', 'kiss', 'king', 'karate']],
      ['c', ['coin', 'code', 'candy', 'cat', 'campus', 'cloud']],
      ['ck', ['attack', 'clock', 'click', 'stick', 'payback', 'pocket']],
      ['ch', ['chemistry', 'chaos', 'psychology', 'technology', 'school', 'technical']],
      ['qu', ['conquer', 'mosquito', 'liquor', 'tequila', 'bouquet', 'lacquer']],
      ['que', ['unique', 'queue', 'technique', 'cheque', 'mosque', 'boutique']],
    ],
  ],
  [
    '/d/',
    'consonant',
    [
      ['d', ['deer', 'dog', 'dock', 'dad', 'drum', 'day']],
      ['dd', ['middle', 'ladder', 'riddle', 'daddy', 'add', 'addition']],
      ['ed', ['played', 'closed', 'opened', 'cleaned', 'learned', 'caused']],
    ],
  ],
  [
    '/f/',
    'consonant',
    [
      ['f', ['father', 'far', 'five', 'foggy', 'gift', 'finger']],
      ['ff', ['coffee', 'difficult', 'staff', 'waffle', 'buffet', 'off']],
      ['gh', ['enough', 'laugh', 'tough', 'rough', 'cough']],
      ['ph', ['physic', 'phone', 'phonics', 'alphabet', 'physical', 'alpha']],
    ],
  ],
  [
    '/g/',
    'consonant',
    [
      ['g', ['gate', 'dog', 'go', 'game', 'give', 'target']],
      ['gg', ['egg', 'foggy', 'goggle', 'buggy', 'biggest', 'trigger']],
      ['gu', ['guardian', 'guitar', 'guide', 'guild', 'guy', 'guest']],
      ['gh', ['spaghetti', 'ghoul', 'ghost', 'ghast', 'ghetto', 'gherkin']],
      ['gue', ['league', 'plague', 'vague', 'colleague', 'vogue', 'logue']],
    ],
  ],
  [
    '/h/',
    'consonant',
    [
      ['h', ['house', 'home', 'hey', 'head', 'hope', 'hold']],
      ['wh', ['whole', 'who', 'whom', 'whose']],
    ],
  ],
  [
    '/j/',
    'consonant',
    [
      ['j', ['jump', 'jet', 'jungle', 'Japan', 'enjoy', 'job']],
      ['ge', ['orange', 'vegetable', 'page', 'age', 'challenge', 'language']],
      ['g', ['general', 'urgent', 'gene', 'generation', 'gem', 'germ']],
      ['dge', ['edge', 'fridge', 'dodge', 'knowledge', 'bridge', 'judge']],
    ],
  ],
  [
    '/l/',
    'consonant',
    [
      ['l', ['lucky', 'lazy', 'loop', 'slime', 'silent', 'lamb']],
      ['ll', ['all', 'tell', 'hell', 'ball', 'small', 'call']],
    ],
  ],
  [
    '/ul/',
    'consonant',
    [
      ['le', ['apple', 'table', 'little', 'bottle', 'people', 'simple']],
      ['il', ['april', 'devil', 'evil', 'pupil', 'civil', 'boil']],
      ['al', ['festival', 'animal', 'mammal', 'normal', 'funeral', 'evolutional']],
      ['el', ['panel', 'model', 'towel', 'novel', 'pixel', 'vowel']],
      ['ul', ['helpful', 'colorful', 'beautiful', 'careful', 'useful', 'awful']],
    ],
  ],
  [
    '/m/',
    'consonant',
    [
      ['m', ['magic', 'game', 'milk', 'murder', 'moron', 'mother']],
      ['mm', ['grammar', 'summer', 'mammal', 'hammock', 'hammer', 'comment']],
      ['me', ['income', 'game', 'come', 'time', 'lime', 'welcome']],
      ['mb', ['climb', 'tomb', 'bomb', 'comb', 'womb', 'limb']],
      ['mn', ['Autumn', 'column', 'hymn', 'damn', 'solemn', 'contemn']],
    ],
  ],
  [
    '/n/',
    'consonant',
    [
      ['n', ['name', 'pain', 'gain', 'note', 'nine', 'never']],
      ['nn', ['sunny', 'banner', 'dinner', 'runner', 'tunnel', 'connect']],
      ['kn', ['knight', 'knee', 'knew', 'know', 'knock', 'knife']],
      ['gn', ['gnarl', 'gnarly', 'gnome', 'gnaw', 'gnu', 'design']],
      ['ne', ['marine', 'sardines', 'machine', 'cuisine', 'nine', 'vine']],
    ],
  ],
]

/**
 * Data mặc định lấy từ file backup người dùng để ở gốc repo. File này bị gitignore,
 * nên khi không có (vd build trên Netlify từ git) thì rơi về SEED soạn sẵn ở trên.
 */
const BACKUP = Object.values(
  import.meta.glob<StoredState | AppData>('/phonics-backup-2026-10-21.json', {
    eager: true,
    import: 'default',
  }),
)[0]

/** Bộ âm soạn sẵn trong code, dùng khi không có file backup. */
export function builtinSeedData(): AppData {
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

/** Data nạp khi localStorage trống hoặc khi bấm "Nạp lại data mẫu". Tiến độ ôn luôn bắt đầu lại. */
export function seedData(): AppData {
  if (!BACKUP) return builtinSeedData()
  const data = 'data' in BACKUP ? BACKUP.data : BACKUP
  return {
    phonemes: data.phonemes.map((p) => ({
      ...p,
      graphemes: p.graphemes.map(({ reverseReview, ...g }) => {
        void reverseReview
        return { ...g, examples: [...g.examples], review: newReviewState() }
      }),
    })),
  }
}
