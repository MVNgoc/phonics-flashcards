import { useRef, useState } from 'react'
import { BulkImport } from '../components/BulkImport'
import { PhonemeManager } from '../components/PhonemeManager'
import { ScrollTopButton } from '../components/ScrollTopButton'
import { useStore } from '../hooks/useStore'
import { exportData, parseImported } from '../lib/storage'

const btn = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-600'

export function ManagePage() {
  const { data, replaceAll, resetToSeed } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = parseImported(await file.text())
      replaceAll(imported)
      setMsg({ kind: 'ok', text: `Đã nhập ${imported.phonemes.length} âm (ghi đè dữ liệu cũ).` })
    } catch (err) {
      setMsg({ kind: 'err', text: `Không đọc được file: ${(err as Error).message}` })
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => exportData(data)} className={btn}>
          Export JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => {
            if (confirm('Xoá hết dữ liệu hiện tại và nạp lại data mẫu?')) {
              resetToSeed()
              setMsg({ kind: 'ok', text: 'Đã nạp lại data mẫu.' })
            }
          }}
          className={`${btn} text-rose-600`}
        >
          Nạp lại data mẫu
        </button>
        {msg && (
          <span
            className={`text-sm ${
              msg.kind === 'ok'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {msg.text}
          </span>
        )}
      </section>

      <BulkImport />
      <PhonemeManager />
      <ScrollTopButton />
    </div>
  )
}
