-- Additive SUNFZENITH Queue tenant migration.
-- Apply to a backup/staging copy first. Existing profiles and queues tables must exist.

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shops_owner_id_idx ON shops(owner_id);
CREATE INDEX IF NOT EXISTS shops_is_active_idx ON shops(is_active);

ALTER TABLE queues ADD COLUMN IF NOT EXISTS shop_id TEXT REFERENCES shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS queues_shop_date_status_idx ON queues(shop_id, queue_date, status);

CREATE TABLE IF NOT EXISTS shop_members (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'SHOP_STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shop_members_shop_user_key UNIQUE(shop_id, user_id)
);
CREATE INDEX IF NOT EXISTS shop_members_user_role_idx ON shop_members(user_id, role);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price INTEGER NOT NULL,
  service_limit INTEGER,
  booking_limit INTEGER,
  staff_limit INTEGER,
  features TEXT NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscriptions_status_expires_idx ON subscriptions(status, expires_at);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_mins INTEGER NOT NULL DEFAULT 30,
  price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT services_shop_name_key UNIQUE(shop_id, name)
);
CREATE INDEX IF NOT EXISTS services_shop_active_idx ON services(shop_id, is_active);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  created_by_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  mode TEXT NOT NULL DEFAULT 'appointment',
  ticket_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_shop_ticket_key UNIQUE(shop_id, ticket_number)
);
CREATE INDEX IF NOT EXISTS bookings_shop_start_status_idx ON bookings(shop_id, starts_at, status);
CREATE INDEX IF NOT EXISTS bookings_service_start_status_idx ON bookings(service_id, starts_at, status);

CREATE TABLE IF NOT EXISTS business_hours (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT business_hours_shop_weekday_key UNIQUE(shop_id, weekday)
);
CREATE TABLE IF NOT EXISTS queue_counters (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  queue_date TEXT NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT queue_counters_shop_date_key UNIQUE(shop_id, queue_date)
);

-- Seed the configurable plans once. The application only provisions FREE automatically.
INSERT INTO plans(id, code, name, monthly_price, service_limit, booking_limit, staff_limit, features)
VALUES
  ('plan-free', 'FREE', 'FREE', 0, 1, 20, 1, '[]'),
  ('plan-starter', 'STARTER', 'STARTER', 59, 5, 200, 1, '[]'),
  ('plan-pro', 'PRO', 'PRO', 129, NULL, 1000, 1, '["statistics"]'),
  ('plan-business', 'BUSINESS', 'BUSINESS', 199, NULL, 3000, NULL, '["multiple_staff","advanced_reports"]')
ON CONFLICT(code) DO NOTHING;

-- Defense-in-depth RLS. The server must SET LOCAL app.user_id to the verified profile ID
-- inside each transaction before depending on these policies. Public shop/service reads
-- are limited to active records; customer booking rows are never public-readable.
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shops_public_active_read ON shops;
CREATE POLICY shops_public_active_read ON shops FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS shops_member_access ON shops;
CREATE POLICY shops_member_access ON shops FOR ALL USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = shops.id AND m.user_id = current_setting('app.user_id', true))
) WITH CHECK (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = shops.id AND m.user_id = current_setting('app.user_id', true))
);
DROP POLICY IF EXISTS shop_members_self_read ON shop_members;
CREATE POLICY shop_members_self_read ON shop_members FOR SELECT USING (user_id = current_setting('app.user_id', true));
DROP POLICY IF EXISTS services_public_active_read ON services;
CREATE POLICY services_public_active_read ON services FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS services_member_write ON services;
CREATE POLICY services_member_write ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = services.shop_id AND m.user_id = current_setting('app.user_id', true))
) WITH CHECK (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = services.shop_id AND m.user_id = current_setting('app.user_id', true))
);
DROP POLICY IF EXISTS bookings_member_access ON bookings;
CREATE POLICY bookings_member_access ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = bookings.shop_id AND m.user_id = current_setting('app.user_id', true))
) WITH CHECK (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = bookings.shop_id AND m.user_id = current_setting('app.user_id', true))
);
DROP POLICY IF EXISTS hours_member_access ON business_hours;
CREATE POLICY hours_member_access ON business_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = business_hours.shop_id AND m.user_id = current_setting('app.user_id', true))
) WITH CHECK (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = business_hours.shop_id AND m.user_id = current_setting('app.user_id', true))
);
DROP POLICY IF EXISTS counters_member_access ON queue_counters;
CREATE POLICY counters_member_access ON queue_counters FOR ALL USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = queue_counters.shop_id AND m.user_id = current_setting('app.user_id', true))
) WITH CHECK (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = queue_counters.shop_id AND m.user_id = current_setting('app.user_id', true))
);
DROP POLICY IF EXISTS subscriptions_member_read ON subscriptions;
CREATE POLICY subscriptions_member_read ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM shop_members m WHERE m.shop_id = subscriptions.shop_id AND m.user_id = current_setting('app.user_id', true))
);
