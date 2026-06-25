export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, parseTaskList } from '@/lib/openai'
import sql, { initSchema } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await initSchema()
    const formData = await req.formData()
    const file = formData.get('audio') as File
    if (!file) return NextResponse.json({ error: 'Áudio não recebido' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const transcription = await transcribeAudio(buffer, file.name || 'audio.webm')
    const parsed = await parseTaskList(transcription)

    if (!parsed.tasks.length) {
      return NextResponse.json({ error: 'Nenhuma tarefa identificada' }, { status: 400 })
    }

    const inserted = []
    for (const t of parsed.tasks) {
      const [task] = await sql`
        INSERT INTO daily_tasks (date, time, title)
        VALUES (${parsed.date}, ${t.time ?? null}, ${t.title})
        RETURNING *
      `
      inserted.push(task)
    }

    return NextResponse.json({ tasks: inserted, date: parsed.date, transcription })
  } catch (e: any) {
    console.error('voice-tasks error:', e)
    return NextResponse.json({ error: e.message ?? 'Erro interno' }, { status: 500 })
  }
}
