import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

let initialized = false

export async function initSchema() {
  if (initialized) return
  initialized = true
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('appointment', 'task')),
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        date DATE,
        time TIME,
        reminder_at TIMESTAMPTZ,
        reminder_notified BOOLEAN DEFAULT FALSE,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  } catch (e) {
    console.error('initSchema error:', e)
  }
}

export default sql
