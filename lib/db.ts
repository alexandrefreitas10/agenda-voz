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
        whatsapp_number TEXT,
        whatsapp_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Adicionar colunas se não existirem
    try { await sql`ALTER TABLE items ADD COLUMN whatsapp_number TEXT` } catch (e) {}
    try { await sql`ALTER TABLE items ADD COLUMN whatsapp_name TEXT` } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'recurring' CHECK (type IN ('recurring', 'installment', 'single')),
        installment_current INTEGER,
        installment_total INTEGER,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        owner TEXT NOT NULL DEFAULT 'mine' CHECK (owner IN ('mine', 'wife', 'shared')),
        auto_debit BOOLEAN DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    try { await sql`ALTER TABLE expenses ADD COLUMN category TEXT DEFAULT ''` } catch (e) {}
    try { await sql`ALTER TABLE expenses ADD COLUMN notes TEXT DEFAULT ''` } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        time TEXT,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS commitments (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        scheduled_time TEXT,
        location TEXT DEFAULT '',
        deadline DATE,
        is_open BOOLEAN DEFAULT TRUE,
        urgency TEXT NOT NULL DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
        priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } catch (e) {
    console.error('initSchema error:', e)
  }
}

export default sql
