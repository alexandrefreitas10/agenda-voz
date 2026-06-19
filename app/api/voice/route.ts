export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, parseTranscription } from '@/lib/openai'
import sql, { initSchema } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await initSchema()
    const formData = await req.formData()
    const file = formData.get('audio') as File
    if (!file) return NextResponse.json({ error: 'Áudio não recebido' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const transcription = await transcribeAudio(buffer, file.name || 'audio.webm')
    const parsed = await parseTranscription(transcription)

    let reminderAt: string | null = null
    if (parsed.type === 'appointment' && parsed.date && parsed.reminder_minutes != null) {
      const dateTime = parsed.time
        ? new Date(`${parsed.date}T${parsed.time}:00`)
        : new Date(`${parsed.date}T09:00:00`)
      dateTime.setMinutes(dateTime.getMinutes() - parsed.reminder_minutes)
      reminderAt = dateTime.toISOString()
    } else if (parsed.type === 'task' && parsed.reminder_minutes != null && parsed.date) {
      const dateTime = parsed.time
        ? new Date(`${parsed.date}T${parsed.time}:00`)
        : new Date(`${parsed.date}T09:00:00`)
      dateTime.setMinutes(dateTime.getMinutes() - parsed.reminder_minutes)
      reminderAt = dateTime.toISOString()
    }

    const [item] = await sql`
      INSERT INTO items (type, title, description, date, time, reminder_at)
      VALUES (
        ${parsed.type},
        ${parsed.title},
        ${parsed.description ?? ''},
        ${parsed.date ?? null},
        ${parsed.time ?? null},
        ${reminderAt}
      )
      RETURNING *
    `

    return NextResponse.json({ item, transcription })
  } catch (e: any) {
    console.error('voice route error:', e)
    return NextResponse.json({ error: e.message ?? 'Erro interno' }, { status: 500 })
  }
}
