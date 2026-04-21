-- ═══════════════════════════════════════════════════════════
-- First Fly Digital Solutions — Admin Dashboard Seed Data
-- Only seeds the default Super Admin account.
-- All other data is managed via the API.
-- ═══════════════════════════════════════════════════════════

-- ── Default Super Admin ────────────────────────────────
-- Password: FirstFly@2026  (bcrypt 12 rounds)
-- Hash generated via: bcryptjs.hashSync('FirstFly@2026', 12)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('First Fly Admin', 'admin@firstfly.in',
   '$2a$12$LJ3m4ys4Rz6YI.LkAqOX6OYmHsFbGK6V7v5j/p5MqJf2rFDXaAqHe',
   'super_admin');

-- ═══════════════════════════════════════════════════════════
-- Seed complete. Use the REST API to create all other data.
-- ═══════════════════════════════════════════════════════════
