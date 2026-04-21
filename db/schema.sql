-- ═══════════════════════════════════════════════════════════
-- First Fly Digital Solutions — Admin Dashboard PostgreSQL Schema
-- Version 1.0  |  April 2026
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop existing tables (dev only) ─────────────────────
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS activity_log     CASCADE;
DROP TABLE IF EXISTS requirements     CASCADE;
DROP TABLE IF EXISTS invoices         CASCADE;
DROP TABLE IF EXISTS projects         CASCADE;
DROP TABLE IF EXISTS services         CASCADE;
DROP TABLE IF EXISTS team_members     CASCADE;
DROP TABLE IF EXISTS clients          CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- ═════════════════════════════════════════════════════════
-- 1. USERS
-- ═════════════════════════════════════════════════════════
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'view_only'
                CHECK (role IN ('super_admin', 'admin', 'view_only')),
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 2. CLIENTS
-- ═════════════════════════════════════════════════════════
CREATE TABLE clients (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150)  NOT NULL,
  contact      VARCHAR(100),
  phone        VARCHAR(20),
  email        VARCHAR(150),
  project_type VARCHAR(60),
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status       VARCHAR(20)   NOT NULL DEFAULT 'Pending'
               CHECK (status IN ('Active', 'Pending', 'On Hold')),
  created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 3. REQUIREMENTS
-- ═════════════════════════════════════════════════════════
CREATE TABLE requirements (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title      VARCHAR(200)  NOT NULL,
  detail     TEXT,
  priority   VARCHAR(10)   NOT NULL DEFAULT 'Medium'
             CHECK (priority IN ('High', 'Medium', 'Low')),
  status     VARCHAR(20)   NOT NULL DEFAULT 'Pending'
             CHECK (status IN ('Pending', 'In Progress', 'Done')),
  created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 4. INVOICES
-- ═════════════════════════════════════════════════════════
CREATE TABLE invoices (
  id             SERIAL PRIMARY KEY,
  invoice_number VARCHAR(20)   NOT NULL UNIQUE,
  client_id      INTEGER       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project        VARCHAR(200),
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20)   NOT NULL DEFAULT 'Unpaid'
                 CHECK (status IN ('Paid', 'Partial', 'Unpaid')),
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Auto-generate invoice numbers: INV-001, INV-002, ...
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || LPAD(NEW.id::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- ═════════════════════════════════════════════════════════
-- 5. PROJECTS
-- ═════════════════════════════════════════════════════════
CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER       REFERENCES clients(id) ON DELETE SET NULL,
  name        VARCHAR(200)  NOT NULL,
  type        VARCHAR(60),
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  progress    INTEGER       NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status      VARCHAR(20)   NOT NULL DEFAULT 'Active'
              CHECK (status IN ('Active', 'Done', 'On Hold')),
  description TEXT,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 6. SERVICES
-- ═════════════════════════════════════════════════════════
CREATE TABLE services (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  icon        VARCHAR(50),
  description TEXT,
  price       VARCHAR(50),
  tag         VARCHAR(50),
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 7. TEAM MEMBERS
-- ═════════════════════════════════════════════════════════
CREATE TABLE team_members (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  role                VARCHAR(80),
  active_projects     INTEGER      NOT NULL DEFAULT 0,
  completed_projects  INTEGER      NOT NULL DEFAULT 0,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 8. TASK ASSIGNMENTS
-- ═════════════════════════════════════════════════════════
CREATE TABLE task_assignments (
  id         SERIAL PRIMARY KEY,
  member_id  INTEGER     NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_id INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role       VARCHAR(80),
  progress   INTEGER     NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status     VARCHAR(20) NOT NULL DEFAULT 'Active'
             CHECK (status IN ('Active', 'Done', 'On Hold')),
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════
-- 9. ACTIVITY LOG
-- ═════════════════════════════════════════════════════════
CREATE TABLE activity_log (
  id          SERIAL PRIMARY KEY,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INTEGER,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  timestamp   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_clients_status          ON clients(status);
CREATE INDEX idx_requirements_client     ON requirements(client_id);
CREATE INDEX idx_requirements_status     ON requirements(status);
CREATE INDEX idx_invoices_client         ON invoices(client_id);
CREATE INDEX idx_invoices_status         ON invoices(status);
CREATE INDEX idx_projects_client         ON projects(client_id);
CREATE INDEX idx_projects_type           ON projects(type);
CREATE INDEX idx_projects_status         ON projects(status);
CREATE INDEX idx_task_assignments_member ON task_assignments(member_id);
CREATE INDEX idx_activity_log_timestamp  ON activity_log(timestamp DESC);

-- ═══════════════════════════════════════════════════════════
-- Schema complete.
-- ═══════════════════════════════════════════════════════════
