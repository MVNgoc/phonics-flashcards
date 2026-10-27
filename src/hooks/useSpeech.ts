import { useCallback, useEffect, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const isBritish = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase().startsWith('en-gb')

/** Giọng đời cũ (Eloquence) và giọng vui của macOS: âm cuối mờ, không dùng để luyện nghe. */
const POOR =
  /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|fred|good news|jester|junior|kathy|organ|ralph|superstar|trinoids|whisper|wobble|zarvox)\b/i

/**
 * Thứ tự ưu tiên, khớp với tên + voiceURI. Giọng tốt nhất tuỳ trình duyệt: Edge có
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

const rank = (v: SpeechSynthesisVoice) => {
  const key = `${v.name} ${v.voiceURI}`
  const i = PREFERRED.findIndex((re) => re.test(key))
  return i === -1 ? PREFERRED.length : i
}

/**
 * Chỉ dùng một giọng: giọng Anh-Anh (en-GB) tốt nhất máy có, vì app học tiếng
 * Anh-Anh. Máy không có giọng en-GB nào thì mới lấy giọng tiếng Anh khác.
 */
function bestVoice(): SpeechSynthesisVoice | null {
  if (!supported) return null
  const all = speechSynthesis.getVoices()
  const british = all.filter(isBritish)
  const pool = british.length ? british : all.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const good = pool.filter((v) => !POOR.test(v.name))
  const list = good.length ? good : pool
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))[0] ?? null
}

/**
 * Đọc từ bằng Web Speech API có sẵn trong trình duyệt (miễn phí). Danh sách giọng
 * nạp bất đồng bộ nên lắng nghe `voiceschanged`.
 */
export function useSpeech() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(bestVoice)

  useEffect(() => {
    if (!supported) return
    const update = () => setVoice(bestVoice())
    speechSynthesis.addEventListener('voiceschanged', update)
    update()
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

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
  const hasBritish = voice ? isBritish(voice) : false

  return { supported, voice, speak, hasBritish }
}
