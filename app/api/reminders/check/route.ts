export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  try {
    await initSchema()

    const due = await sql`
      SELECT * FROM items
      WHERE reminder_at IS NOT NULL
        AND reminder_notified = false
        AND reminder_at <= NOW() + INTERVAL '1 minute'
        AND reminder_at >= NOW() - INTERVAL '5 minutes'
        AND completed = false
    `

    if (due.length === 0) {
      return NextResponse.json({ reminders: [] })
    }

    const reminders = due.map(item => ({
      title: item.type === 'appointment' ? '📅 ' + item.title : '✅ ' + item.title,
      body: item.time ? `Às ${String(item.time).slice(0, 5)}` : 'Lembrete da sua tarefa',
      tag: `item-${item.id}`,
    }))

    await Promise.all(
      due.map(item => sql`UPDATE items SET reminder_notified = true WHERE id = ${item.id}`)
    )

    console.log(`✓ ${reminders.length} reminder(s) notified`)

    return NextResponse.json({ reminders })
  } catch (e: any) {
    console.error('Reminder check error:', e)
    return NextResponse.json({ reminders: [], error: e.message })
  }
}
