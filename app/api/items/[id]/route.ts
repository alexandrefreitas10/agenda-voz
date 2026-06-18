import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  if ('completed' in body) {
    await sql`UPDATE items SET completed = ${body.completed} WHERE id = ${id}`
  }
  if ('title' in body) {
    await sql`UPDATE items SET title = ${body.title} WHERE id = ${id}`
  }
  if ('reminder_at' in body) {
    await sql`UPDATE items SET reminder_at = ${body.reminder_at}, reminder_notified = false WHERE id = ${id}`
  }
  if ('date' in body || 'time' in body) {
    await sql`UPDATE items SET date = ${body.date ?? null}, time = ${body.time ?? null} WHERE id = ${id}`
  }

  const [item] = await sql`SELECT * FROM items WHERE id = ${id}`
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await sql`DELETE FROM items WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
