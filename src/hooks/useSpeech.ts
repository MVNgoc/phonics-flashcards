import { useCallback, useEffect, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const isBritish = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase().startsWith('en-gb')

/** Giọng đời cũ (Eloquence) và giọng vui của macOS: âm cuối mờ, xếp cuối danh sách. */
const POOR =
  /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|fred|good news|jester|junior|kathy|organ|ralph|superstar|trinoids|whisper|wobble|zarvox)\b/i

/**
 * Thứ tự gợi ý, khớp với tên + voiceURI. Giọng tốt nhất tuỳ trình duyệt: Edge có
 * giọng AI của Microsoft, Chrome có giọng online của Google, Safari dùng giọng
 * Premium/Enhanced nếu đã tải trong cài đặt macOS.
 */
const PREFERRED: RegExp[] = [
  /microsoft sonia online/i,
  /microsoft .*online \(natural\)/i,
  /^google uk english female/i,
  /^google uk english/i,
  /premium/i,
  /enhanced/i,
  /^daniel\b/i,
]

/** Giọng tốt xếp trước, giọng đời cũ xếp cuối. */
const rank = (v: SpeechSynthesisVoice) => {
  if (POOR.test(v.name)) return PREFERRED.length + 1
  const key = `${v.name} ${v.voiceURI}`
  const i = PREFERRED.findIndex((re) => re.test(key))
  return i === -1 ? PREFERRED.length : i
}

/**
 * Giọng cho chọn: chỉ giọng Anh-Anh (en-GB), vì app học tiếng Anh-Anh; máy không có
 * giọng en-GB nào thì mới đưa các giọng tiếng Anh khác ra. Giọng tốt nhất đứng đầu.
 */
function britishVoices(): SpeechSynthesisVoice[] {
  if (!supported) return []
  const all = speechSynthesis.getVoices()
  const british = all.filter(isBritish)
  const list = british.length ? british : all.filter((v) => v.lang.toLowerCase().startsWith('en'))
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/**
 * Đọc từ bằng Web Speech API có sẵn trong trình duyệt (miễn phí). Danh sách giọng
 * nạp bất đồng bộ nên lắng nghe `voiceschanged`. `voiceURI` rỗng hoặc không còn
 * trong danh sách → giọng tốt nhất.
 */
export function useSpeech(voiceURI: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(britishVoices)

  useEffect(() => {
    if (!supported) return
    const update = () => setVoices(britishVoices())
    speechSynthesis.addEventListener('voiceschanged', update)
    update()
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0] ?? null

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!supported) return
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang ?? 'en-GB'
      utterance.rate = rate
      speechSynthesis.speak(utterance)
    },
    [voice],
  )

  /** false khi máy không có giọng en-GB nào, đang dùng tạm giọng tiếng Anh khác. */
  const hasBritish = voices.some(isBritish)

  return { supported, voices, voice, speak, hasBritish }
}
