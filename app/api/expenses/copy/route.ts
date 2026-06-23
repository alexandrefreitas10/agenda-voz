export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function POST(req: NextRequest) {
  await initSchema()
  const { fromMonth, toMonth } = await req.json()

  const source = await sql`SELECT * FROM expenses WHERE month = ${fromMonth}`
  if (source.length === 0) return NextResponse.json({ copied: 0 })

  const copied = []
  for (const e of source) {
    // Avançar parcela se for parcelada
    const nextInstallment = e.installment_current != null ? e.installment_current + 1 : null
    // Não copiar se já foi a última parcela
    if (e.type === 'installment' && nextInstallment != null && e.installment_total != null && nextInstallment > e.installment_total) continue

    const [newExpense] = await sql`
      INSERT INTO expenses (month, name, category, type, installment_current, installment_total, amount, owner, auto_debit, status, notes)
      VALUES (
        ${toMonth},
        ${e.name},
        ${e.category ?? ''},
        ${e.type},
        ${nextInstallment},
        ${e.installment_total ?? null},
        ${e.amount},
        ${e.owner},
        ${e.auto_debit},
        'unpaid',
        ${e.notes ?? ''}
      )
      RETURNING *
    `
    copied.push(newExpense)
  }

  return NextResponse.json({ copied: copied.length, expenses: copied })
}
