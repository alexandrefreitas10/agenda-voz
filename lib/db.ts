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
  } catch (e) {
    console.error('initSchema error:', e)
  }
}

export default sql
