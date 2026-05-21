-- Faza 2: platform-wide installed module packages

CREATE TABLE IF NOT EXISTS platform_modules (
  id          TEXT NOT NULL,
  version     TEXT NOT NULL,
  manifest    JSONB NOT NULL,
  bundle_path TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version)
);

CREATE INDEX IF NOT EXISTS idx_platform_modules_id ON platform_modules(id);
