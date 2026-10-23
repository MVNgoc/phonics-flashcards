import { useCallback, useEffect, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const isBritish = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase().startsWith('en-gb')

/**
 * Giọng đọc được chọn: chỉ giọng Anh-Anh (en-GB), vì app học tiếng Anh-Anh. Máy
 * không có giọng en-GB nào thì mới đưa các giọng tiếng Anh khác ra.
 */
function britishVoices(): SpeechSynthesisVoice[] {
  if (!supported) return []
  const all = speechSynthesis.getVoices()
  const british = all.filter(isBritish)
  const list = british.length ? british : all.filter((v) => v.lang.toLowerCase().startsWith('en'))
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Đọc từ bằng Web Speech API có sẵn trong trình duyệt (offline, miễn phí). Danh
 * sách giọng nạp bất đồng bộ nên lắng nghe `voiceschanged`. `voiceURI` rỗng hoặc
 * không còn trong danh sách → giọng đầu tiên.
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
