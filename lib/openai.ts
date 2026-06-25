import OpenAI from 'openai'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export interface ParsedItem {
  type: 'appointment' | 'task'
  title: string
  description?: string
  date?: string        // YYYY-MM-DD
  time?: string        // HH:MM
  reminder_minutes?: number | null
}

const TODAY = () => new Date().toISOString().split('T')[0]
const NOW_ISO = () => new Date().toISOString()

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const mimeType = filename.endsWith('.ogg') ? 'audio/ogg' : 'audio/webm'
  console.log('Transcribing:', { filename, mimeType, size: audioBuffer.length })
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: mimeType })
  const result = await getClient().audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'pt',
  })
  return result.text
}

export interface ParsedTaskList {
  date: string // YYYY-MM-DD
  tasks: { time: string | null; title: string }[]
}

export async function parseTaskList(text: string): Promise<ParsedTaskList> {
  const today = TODAY()
  const nowIso = NOW_ISO()

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um assistente pessoal. Hoje é ${today} (${nowIso}).
O usuário vai ditar uma lista de atividades para um dia específico, com horários.
Extraia a data mencionada (segunda, terça, amanhã, etc.) e a lista de tarefas com horários.

Retorne APENAS um JSON com:
- date: data no formato YYYY-MM-DD (se não mencionado, use amanhã: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]})
- tasks: array de objetos com:
  - time: horário no formato HH:MM (null se não mencionado)
  - title: nome curto e claro da atividade

Exemplo: "Segunda, 7h Aula de Tênis. 8h Café da manhã. 9h Cortar o cabelo."
→ { "date": "2026-06-29", "tasks": [{"time":"07:00","title":"Aula de Tênis"},{"time":"08:00","title":"Café da manhã"},{"time":"09:00","title":"Cortar o cabelo"}] }`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = JSON.parse(response.choices[0].message.content ?? '{}')
  return {
    date: raw.date ?? new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map((t: any) => ({ time: t.time ?? null, title: String(t.title ?? '') })) : [],
  }
}

export async function parseTranscription(text: string): Promise<ParsedItem> {
  const today = TODAY()
  const nowIso = NOW_ISO()

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um assistente de agenda pessoal. Hoje é ${today} (${nowIso}).
Analise o texto em português e extraia as informações de um compromisso ou tarefa.

Retorne APENAS um JSON com:
- type: "appointment" (tem data/hora específica) ou "task" (sem data fixa)
- title: título curto e claro
- description: detalhes extras (pode ser vazio)
- date: data no formato YYYY-MM-DD (null se não mencionado)
- time: hora no formato HH:MM (null se não mencionado)
- reminder_minutes: minutos de antecedência para lembrete (null se não mencionado)

Referências de tempo: "hoje" = ${today}, "amanhã" = próximo dia, "semana que vem" = próxima semana.
Exemplos de lembrete: "me lembra 30 minutos antes" = 30, "avisa 1 hora antes" = 60, "lembra no dia" = 0.`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = JSON.parse(response.choices[0].message.content ?? '{}')

  return {
    type: raw.type === 'appointment' ? 'appointment' : 'task',
    title: String(raw.title ?? text.slice(0, 80)),
    description: raw.description ?? '',
    date: raw.date ?? undefined,
    time: raw.time ?? undefined,
    reminder_minutes: raw.reminder_minutes ?? null,
  }
}
