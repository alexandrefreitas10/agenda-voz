import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  if ('completed' in body) await sql`UPDATE daily_tasks SET completed = ${body.completed} WHERE id = ${id}`
  if ('title' in body) await sql`UPDATE daily_tasks SET title = ${body.title} WHERE id = ${id}`
  if ('time' in body) await sql`UPDATE daily_tasks SET time = ${body.time} WHERE id = ${id}`
  const [task] = await sql`SELECT * FROM daily_tasks WHERE id = ${id}`
  return NextResponse.json(task)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await sql`DELETE FROM daily_tasks WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
