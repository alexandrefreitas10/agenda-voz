export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initSchema()
  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const tasks = await sql`SELECT * FROM daily_tasks WHERE date = ${date} ORDER BY time ASC NULLS LAST, created_at ASC`
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  await initSchema()
  const { date, time, title } = await req.json()
  const [task] = await sql`
    INSERT INTO daily_tasks (date, time, title)
    VALUES (${date}, ${time ?? null}, ${title})
    RETURNING *
  `
  return NextResponse.json(task, { status: 201 })
}
