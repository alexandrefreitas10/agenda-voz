import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  await initSchema()
  const items = await sql`SELECT * FROM items WHERE completed = false ORDER BY date ASC NULLS LAST, time ASC NULLS LAST, created_at ASC`
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  await initSchema()
  const body = await req.json()
  const [item] = await sql`
    INSERT INTO items (type, title, description, date, time, reminder_at)
    VALUES (${body.type}, ${body.title}, ${body.description ?? ''}, ${body.date ?? null}, ${body.time ?? null}, ${body.reminder_at ?? null})
    RETURNING *
  `
  return NextResponse.json(item, { status: 201 })
}
