import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  if ('status' in body) await sql`UPDATE expenses SET status = ${body.status} WHERE id = ${id}`
  if ('amount' in body) await sql`UPDATE expenses SET amount = ${body.amount} WHERE id = ${id}`
  if ('name' in body) await sql`UPDATE expenses SET name = ${body.name} WHERE id = ${id}`
  if ('due_day' in body) await sql`UPDATE expenses SET due_day = ${body.due_day} WHERE id = ${id}`
  if ('auto_debit' in body) await sql`UPDATE expenses SET auto_debit = ${body.auto_debit} WHERE id = ${id}`
  if ('owner' in body) await sql`UPDATE expenses SET owner = ${body.owner} WHERE id = ${id}`
  if ('notes' in body) await sql`UPDATE expenses SET notes = ${body.notes} WHERE id = ${id}`
  if ('installment_current' in body) await sql`UPDATE expenses SET installment_current = ${body.installment_current} WHERE id = ${id}`

  const [expense] = await sql`SELECT * FROM expenses WHERE id = ${id}`
  return NextResponse.json(expense)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await sql`DELETE FROM expenses WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
