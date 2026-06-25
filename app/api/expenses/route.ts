export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initSchema()
  const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const expenses = await sql`SELECT * FROM expenses WHERE month = ${month} ORDER BY created_at ASC`
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  await initSchema()
  const body = await req.json()
  const [expense] = await sql`
    INSERT INTO expenses (month, name, due_day, type, installment_current, installment_total, amount, owner, auto_debit, status, notes)
    VALUES (
      ${body.month},
      ${body.name},
      ${body.due_day ?? null},
      ${body.type ?? 'recurring'},
      ${body.installment_current ?? null},
      ${body.installment_total ?? null},
      ${body.amount ?? 0},
      ${body.owner ?? 'mine'},
      ${body.auto_debit ?? false},
      ${body.status ?? 'unpaid'},
      ${body.notes ?? ''}
    )
    RETURNING *
  `
  return NextResponse.json(expense, { status: 201 })
}
