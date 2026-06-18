import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function POST(req: NextRequest) {
  await initSchema()
  const { endpoint, keys } = await req.json()
  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}
