-- Forge Platform — multi-tenant schema

CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id              TEXT NOT NULL,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  draft_manifest  JSONB NOT NULL DEFAULT '{}',
  published_manifest JSONB NOT NULL DEFAULT '{}',
  revision        BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS manifest_revisions (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  site_id     TEXT NOT NULL,
  revision    BIGINT NOT NULL,
  manifest    JSONB NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('draft', 'published')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, site_id) REFERENCES sites(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_modules (
  tenant_id   TEXT NOT NULL,
  site_id     TEXT NOT NULL,
  module_id   TEXT NOT NULL,
  version     TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  config      JSONB NOT NULL DEFAULT '{}',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, site_id, module_id),
  FOREIGN KEY (tenant_id, site_id) REFERENCES sites(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  site_id     TEXT,
  actor       TEXT,
  action      TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_tenant ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revisions_site ON manifest_revisions(tenant_id, site_id, revision DESC);
