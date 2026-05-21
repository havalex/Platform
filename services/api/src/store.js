import pg from 'pg';
import { EMPTY_MANIFEST } from '@forge/manifest-types';
import { validateManifest } from '@forge/schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://forge:forge@localhost:5432/forge',
});

export { pool };

export async function ensureBootstrap() {
  const tenantId = process.env.FORGE_BOOTSTRAP_TENANT || 'default';
  const siteId = process.env.FORGE_BOOTSTRAP_SITE || 'main';

  await pool.query(
    `INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    [tenantId, 'Default Tenant'],
  );

  const manifest = structuredClone(EMPTY_MANIFEST);
  await pool.query(
    `INSERT INTO sites (id, tenant_id, slug, name, draft_manifest, published_manifest)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (tenant_id, id) DO NOTHING`,
    [siteId, tenantId, 'main', 'Main Site', JSON.stringify(manifest)],
  );

  for (const modId of ['core-shell', 'forge-blocks']) {
    await pool.query(
      `INSERT INTO site_modules (tenant_id, site_id, module_id, version, enabled, config)
       VALUES ($1, $2, $3, '1.0.0', true, '{}')
       ON CONFLICT (tenant_id, site_id, module_id) DO NOTHING`,
      [tenantId, siteId, modId],
    );
  }

  return { tenantId, siteId };
}

export async function listSiteModules(tenantId, siteId) {
  const { rows } = await pool.query(
    `SELECT module_id, version, enabled, config FROM site_modules
     WHERE tenant_id = $1 AND site_id = $2 ORDER BY module_id`,
    [tenantId, siteId],
  );
  return rows.map(r => ({
    id: r.module_id,
    version: r.version,
    enabled: r.enabled,
    config: r.config,
  }));
}

export async function setModuleEnabled(tenantId, siteId, moduleId, enabled) {
  const { rowCount } = await pool.query(
    `UPDATE site_modules SET enabled = $1
     WHERE tenant_id = $2 AND site_id = $3 AND module_id = $4`,
    [enabled, tenantId, siteId, moduleId],
  );
  if (rowCount === 0) {
    await pool.query(
      `INSERT INTO site_modules (tenant_id, site_id, module_id, version, enabled)
       VALUES ($1, $2, $3, '1.0.0', $4)`,
      [tenantId, siteId, moduleId, enabled],
    );
  }
  await audit(tenantId, siteId, enabled ? 'module.enable' : 'module.disable', { moduleId });
  return { ok: true, moduleId, enabled };
}

export async function getSite(tenantId, siteId) {
  const { rows } = await pool.query(
    `SELECT * FROM sites WHERE tenant_id = $1 AND id = $2`,
    [tenantId, siteId],
  );
  return rows[0] || null;
}

export async function updateDraft(tenantId, siteId, manifest, expectedRevision) {
  const site = await getSite(tenantId, siteId);
  if (!site) return { ok: false, error: 'SITE_NOT_FOUND' };
  if (expectedRevision != null && Number(expectedRevision) !== Number(site.revision)) {
    return { ok: false, error: 'REVISION_CONFLICT', current: site.revision };
  }

  const revision = Number(site.revision) + 1;
  await pool.query(
    `UPDATE sites SET draft_manifest = $1, revision = $2, updated_at = NOW()
     WHERE tenant_id = $3 AND id = $4`,
    [JSON.stringify(manifest), revision, tenantId, siteId],
  );
  await pool.query(
    `INSERT INTO manifest_revisions (tenant_id, site_id, revision, manifest, kind)
     VALUES ($1, $2, $3, $4, 'draft')`,
    [tenantId, siteId, revision, JSON.stringify(manifest)],
  );
  await audit(tenantId, siteId, 'manifest.draft.update', { revision });

  return { ok: true, revision };
}

export async function publish(tenantId, siteId) {
  const site = await getSite(tenantId, siteId);
  if (!site) return { ok: false, error: 'SITE_NOT_FOUND' };

  const revision = Number(site.revision) + 1;
  await pool.query(
    `UPDATE sites SET published_manifest = draft_manifest, revision = $1, updated_at = NOW()
     WHERE tenant_id = $2 AND id = $3`,
    [revision, tenantId, siteId],
  );
  await pool.query(
    `INSERT INTO manifest_revisions (tenant_id, site_id, revision, manifest, kind)
     VALUES ($1, $2, $3, $4, 'published')`,
    [tenantId, siteId, revision, site.draft_manifest],
  );
  await audit(tenantId, siteId, 'manifest.publish', { revision });

  return { ok: true, revision };
}

export async function listSites(tenantId) {
  const { rows } = await pool.query(
    `SELECT id, slug, name, revision, updated_at FROM sites WHERE tenant_id = $1 ORDER BY name`,
    [tenantId],
  );
  return rows;
}

export async function addPage(tenantId, siteId, { route, title, layout = 'default' }) {
  const site = await getSite(tenantId, siteId);
  if (!site) return { ok: false, error: 'SITE_NOT_FOUND' };

  const manifest = structuredClone(site.draft_manifest);
  if (manifest.pages.some(p => p.route === route)) {
    return { ok: false, error: 'ROUTE_EXISTS', route };
  }

  manifest.pages.push({
    route,
    title: title || route,
    layout,
    components: [
      { type: 'Section', id: `section_${route.replace(/\//g, '_')}`, title, children: [
        { type: 'Text', id: 'intro', content: `Welcome to ${title}`, variant: 'heading' },
      ]},
    ],
  });

  const parsed = validateManifest(manifest);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED', issues: parsed.error.flatten() };

  const result = await updateDraft(tenantId, siteId, parsed.data, site.revision);
  return { ...result, manifest: parsed.data };
}

export async function removePage(tenantId, siteId, route) {
  const site = await getSite(tenantId, siteId);
  if (!site) return { ok: false, error: 'SITE_NOT_FOUND' };

  const manifest = structuredClone(site.draft_manifest);
  if (manifest.pages.length <= 1) return { ok: false, error: 'LAST_PAGE' };

  manifest.pages = manifest.pages.filter(p => p.route !== route);
  const parsed = validateManifest(manifest);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  const result = await updateDraft(tenantId, siteId, parsed.data, site.revision);
  return { ...result, manifest: parsed.data };
}

export async function audit(tenantId, siteId, action, payload = {}) {
  await pool.query(
    `INSERT INTO audit_log (tenant_id, site_id, actor, action, payload) VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, siteId, 'system', action, JSON.stringify(payload)],
  );
}
