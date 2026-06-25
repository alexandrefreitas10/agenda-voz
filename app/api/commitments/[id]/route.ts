import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const b = await req.json()
  if ('completed' in b) await sql`UPDATE commitments SET completed = ${b.completed} WHERE id = ${id}`
  if ('title' in b) await sql`UPDATE commitments SET title = ${b.title} WHERE id = ${id}`
  if ('description' in b) await sql`UPDATE commitments SET description = ${b.description} WHERE id = ${id}`
  if ('scheduled_time' in b) await sql`UPDATE commitments SET scheduled_time = ${b.scheduled_time} WHERE id = ${id}`
  if ('location' in b) await sql`UPDATE commitments SET location = ${b.location} WHERE id = ${id}`
  if ('deadline' in b) await sql`UPDATE commitments SET deadline = ${b.deadline} WHERE id = ${id}`
  if ('is_open' in b) await sql`UPDATE commitments SET is_open = ${b.is_open} WHERE id = ${id}`
  if ('urgency' in b) await sql`UPDATE commitments SET urgency = ${b.urgency} WHERE id = ${id}`
  if ('priority' in b) await sql`UPDATE commitments SET priority = ${b.priority} WHERE id = ${id}`
  const [item] = await sql`SELECT * FROM commitments WHERE id = ${id}`
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await sql`DELETE FROM commitments WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
