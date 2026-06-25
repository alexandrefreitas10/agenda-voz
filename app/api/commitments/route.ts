export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  await initSchema()
  const items = await sql`SELECT * FROM commitments WHERE completed = FALSE ORDER BY priority DESC, urgency DESC, created_at ASC`
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  await initSchema()
  const b = await req.json()
  const [item] = await sql`
    INSERT INTO commitments (title, description, scheduled_time, location, deadline, is_open, urgency, priority)
    VALUES (
      ${b.title},
      ${b.description ?? ''},
      ${b.scheduled_time ?? null},
      ${b.location ?? ''},
      ${b.deadline ?? null},
      ${b.is_open ?? true},
      ${b.urgency ?? 'low'},
      ${b.priority ?? 1}
    )
    RETURNING *
  `
  return NextResponse.json(item, { status: 201 })
}
