'use client'

import { useState, useRef } from 'react'

interface Props {
  onResult: (item: any, transcription: string) => void
}

type State = 'idle' | 'recording' | 'processing' | 'error'

export default function MicButton({ onResult }: Props) {
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setState('processing')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'audio.webm')
        try {
          const res = await fetch('/api/voice', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Erro ao processar')
          onResult(data.item, data.transcription)
          setState('idle')
        } catch (e: any) {
          setErrorMsg(e.message)
          setState('error')
        }
      }

      mr.start()
      setState('recording')
    } catch {
      setErrorMsg('Permissão de microfone negada')
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  const label = state === 'idle' ? 'Segurar para gravar' :
    state === 'recording' ? 'Gravando... solte para enviar' :
    state === 'processing' ? 'Processando...' : 'Tente novamente'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={state === 'idle' || state === 'error' ? startRecording : undefined}
        onPointerUp={state === 'recording' ? stopRecording : undefined}
        onPointerLeave={state === 'recording' ? stopRecording : undefined}
        disabled={state === 'processing'}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all select-none touch-none ${
          state === 'recording'
            ? 'bg-red-500 scale-110 shadow-red-500/40'
            : state === 'processing'
            ? 'bg-zinc-700 cursor-not-allowed'
            : state === 'error'
            ? 'bg-red-900 hover:bg-red-800'
            : 'bg-orange-500 hover:bg-orange-400 active:scale-95'
        }`}
      >
        {state === 'processing' ? (
          <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 16.93A7.001 7.001 0 0 1 5 12H3a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12h-2a7 7 0 0 1-6 6.93z" />
          </svg>
        )}
      </button>
      <p className="text-xs text-zinc-400 text-center">{label}</p>
      {state === 'error' && errorMsg && (
        <p className="text-xs text-red-400 text-center max-w-48">{errorMsg}</p>
      )}
    </div>
  )
}
