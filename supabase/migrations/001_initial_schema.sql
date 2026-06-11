-- ============================================================
-- 001_initial_schema.sql
-- MeisterFlow Kundenportal — Initial Database Schema
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE user_profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'customer'
                          CHECK (role IN ('customer', 'admin', 'team_member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name    TEXT        NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  industry        TEXT,
  status          TEXT        NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE requests (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id  UUID        REFERENCES customers(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  status       TEXT        NOT NULL DEFAULT 'new',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointments (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id       UUID        REFERENCES customers(id) ON DELETE CASCADE,
  appointment_date  TIMESTAMPTZ NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'scheduled',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotes (
  id            UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id   UUID           REFERENCES customers(id) ON DELETE CASCADE,
  quote_number  TEXT           NOT NULL,
  status        TEXT           NOT NULL DEFAULT 'pending',
  amount        DECIMAL(10,2),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id              UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id     UUID           REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number  TEXT           NOT NULL,
  status          TEXT           NOT NULL DEFAULT 'pending',
  amount          DECIMAL(10,2),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id  UUID        REFERENCES customers(id) ON DELETE CASCADE,
  rating       INTEGER     CHECK (rating >= 1 AND rating <= 5),
  review_text  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- user_profiles: each user sees and updates only their own row
-- ------------------------------------------------------------

CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());


-- ------------------------------------------------------------
-- customers: users can only access their own customer row
-- ------------------------------------------------------------

CREATE POLICY "customers_select_own"
  ON customers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "customers_insert_own"
  ON customers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_own"
  ON customers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "customers_delete_own"
  ON customers FOR DELETE
  USING (user_id = auth.uid());


-- ------------------------------------------------------------
-- Helper: reusable subquery for owned customer ids
-- Used by all child-table policies below
-- ------------------------------------------------------------

-- requests
CREATE POLICY "requests_select_own"
  ON requests FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "requests_insert_own"
  ON requests FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "requests_update_own"
  ON requests FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "requests_delete_own"
  ON requests FOR DELETE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );


-- appointments
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "appointments_insert_own"
  ON appointments FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "appointments_delete_own"
  ON appointments FOR DELETE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );


-- quotes
CREATE POLICY "quotes_select_own"
  ON quotes FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "quotes_insert_own"
  ON quotes FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "quotes_update_own"
  ON quotes FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "quotes_delete_own"
  ON quotes FOR DELETE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );


-- invoices
CREATE POLICY "invoices_select_own"
  ON invoices FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_insert_own"
  ON invoices FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_update_own"
  ON invoices FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_delete_own"
  ON invoices FOR DELETE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );


-- reviews
CREATE POLICY "reviews_select_own"
  ON reviews FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );
