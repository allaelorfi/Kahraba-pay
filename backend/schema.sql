CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'منزلي',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(120) NOT NULL,
  meter_number VARCHAR(30) NOT NULL,
  region VARCHAR(120) NOT NULL DEFAULT 'غير محدد',
  category VARCHAR(30) NOT NULL DEFAULT 'منزلي',
  service_type VARCHAR(20) NOT NULL DEFAULT 'prepaid' CHECK (service_type IN ('prepaid', 'invoice')),
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS balances (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  daily_avg NUMERIC(12,2) NOT NULL DEFAULT 0,
  days_left INTEGER NOT NULL DEFAULT 0,
  last_top_up VARCHAR(80) NOT NULL DEFAULT 'لا يوجد شحن بعد'
);

CREATE TABLE IF NOT EXISTS consumption (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  last_7_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_avg_ld NUMERIC(12,2) NOT NULL DEFAULT 0,
  month_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  month_change_pct NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_reading JSONB NOT NULL DEFAULT '{}'::jsonb,
  monthly_history JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS invoices (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  period VARCHAR(60) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  issue_date VARCHAR(60) NOT NULL,
  due_date VARCHAR(60) NOT NULL,
  days_until_due INTEGER NOT NULL DEFAULT 0,
  reading JSONB NOT NULL DEFAULT '{}'::jsonb,
  history JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  label VARCHAR(120) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(12,2),
  sign VARCHAR(2) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  low_balance BOOLEAN NOT NULL DEFAULT TRUE,
  invoice_due BOOLEAN NOT NULL DEFAULT TRUE,
  usage_spike BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_summary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'قيد المراجعة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
