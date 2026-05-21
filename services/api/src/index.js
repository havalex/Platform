import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fs from 'node:fs';
import { installModulePackage, listPlatformModules } from './modules/install.js';
import { buildRuntimeModuleManifest } from './modules/runtime-manifest.js';
import { seedBuiltinModules } from './modules/seed.js';
import { bundlePath } from './modules/paths.js';
import { validateManifest } from '@forge/schema';
import {
  ensureBootstrap, getSite, updateDraft, publish, listSites,
  addPage as addPageToSite, removePage as removePageFromSite,
  listSiteModules, setModuleEnabled,
} from './store.js';

const app = new Hono();
const API_KEY = process.env.FORGE_ADMIN_API_KEY || 'dev-change-me';
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',');

app.use('*', cors({ origin: corsOrigins, allowHeaders: ['Content-Type', 'X-Forge-Api-Key', 'If-Match'] }));

app.get('/health', (c) => c.json({ ok: true, service: 'forge-api' }));

/** Require admin key for mutating routes */
function requireAdmin(c, next) {
  const key = c.req.header('X-Forge-Api-Key');
  if (key !== API_KEY) return c.json({ error: 'UNAUTHORIZED' }, 401);
  return next();
}

// ── Tenants / sites ───────────────────────────────────────────────────

app.get('/api/v1/t/:tenantId/sites', async (c) => {
  const sites = await listSites(c.req.param('tenantId'));
  return c.json({ sites });
});

app.get('/api/v1/t/:tenantId/sites/:siteId', async (c) => {
  const site = await getSite(c.req.param('tenantId'), c.req.param('siteId'));
  if (!site) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({
    id: site.id,
    slug: site.slug,
    name: site.name,
    revision: site.revision,
    updatedAt: site.updated_at,
  });
});

// ── Manifest: draft (admin) ───────────────────────────────────────────

app.get('/api/v1/t/:tenantId/sites/:siteId/manifest/draft', async (c) => {
  const site = await getSite(c.req.param('tenantId'), c.req.param('siteId'));
  if (!site) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({
    manifest: site.draft_manifest,
    revision: site.revision,
  });
});

app.put('/api/v1/t/:tenantId/sites/:siteId/manifest/draft', requireAdmin, async (c) => {
  const body = await c.req.json();
  const manifest = body.manifest ?? body;
  const parsed = validateManifest(manifest);
  if (!parsed.success) {
    return c.json({ error: 'VALIDATION_FAILED', issues: parsed.error.flatten() }, 400);
  }

  const ifMatch = c.req.header('If-Match');
  const result = await updateDraft(
    c.req.param('tenantId'),
    c.req.param('siteId'),
    parsed.data,
    ifMatch != null ? Number(ifMatch) : null,
  );

  if (!result.ok) {
    const status = result.error === 'REVISION_CONFLICT' ? 409 : 404;
    return c.json(result, status);
  }
  return c.json(result);
});

/** Scoped patch — AI-safe: only merges given keys on one component id */
app.patch('/api/v1/t/:tenantId/sites/:siteId/manifest/draft/components/:componentId', requireAdmin, async (c) => {
  const { patch, scope } = await c.req.json();
  const site = await getSite(c.req.param('tenantId'), c.req.param('siteId'));
  if (!site) return c.json({ error: 'NOT_FOUND' }, 404);

  const manifest = structuredClone(site.draft_manifest);
  const id = c.req.param('componentId');
  let found = false;

  function walk(components) {
    for (const comp of components || []) {
      if (comp.id === id) {
        Object.assign(comp, patch);
        found = true;
        return;
      }
      if (comp.children) walk(comp.children);
      if (comp.tabs) for (const t of comp.tabs) if (t.children) walk(t.children);
    }
  }
  for (const page of manifest.pages || []) walk(page.components);

  if (!found) return c.json({ error: 'COMPONENT_NOT_FOUND', id }, 404);

  const parsed = validateManifest(manifest);
  if (!parsed.success) {
    return c.json({ error: 'VALIDATION_FAILED', issues: parsed.error.flatten() }, 400);
  }

  const result = await updateDraft(c.req.param('tenantId'), c.req.param('siteId'), parsed.data, site.revision);
  if (!result.ok) return c.json(result, 409);
  return c.json({ ...result, patched: id, scope: scope || 'all' });
});

// ── Manifest: published (runtime / public) ────────────────────────────

app.get('/api/v1/t/:tenantId/sites/:siteId/manifest/published', async (c) => {
  const site = await getSite(c.req.param('tenantId'), c.req.param('siteId'));
  if (!site) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({
    manifest: site.published_manifest,
    revision: site.revision,
  });
});

app.post('/api/v1/t/:tenantId/sites/:siteId/publish', requireAdmin, async (c) => {
  const result = await publish(c.req.param('tenantId'), c.req.param('siteId'));
  if (!result.ok) return c.json(result, 404);
  return c.json(result);
});

// ── Pages ─────────────────────────────────────────────────────────────

app.post('/api/v1/t/:tenantId/sites/:siteId/pages', requireAdmin, async (c) => {
  const body = await c.req.json();
  const result = await addPageToSite(c.req.param('tenantId'), c.req.param('siteId'), body);
  if (!result.ok) return c.json(result, result.error === 'ROUTE_EXISTS' ? 409 : 400);
  return c.json(result);
});

app.delete('/api/v1/t/:tenantId/sites/:siteId/pages', requireAdmin, async (c) => {
  const { route } = await c.req.json();
  const result = await removePageFromSite(c.req.param('tenantId'), c.req.param('siteId'), route);
  if (!result.ok) return c.json(result, 400);
  return c.json(result);
});

// ── Modules (Faza 2) ──────────────────────────────────────────────────

app.get('/api/v1/t/:tenantId/sites/:siteId/modules', async (c) => {
  const installed = await listSiteModules(c.req.param('tenantId'), c.req.param('siteId'));
  const platform = await listPlatformModules();
  const catalog = platform.map(p => ({
    id: p.id,
    name: p.manifest?.name || p.id,
    version: p.version,
    description: p.manifest?.permissions?.join(', ') || '',
    components: p.manifest?.components || [],
  }));
  return c.json({ catalog, installed });
});

app.get('/api/v1/t/:tenantId/sites/:siteId/modules/runtime', async (c) => {
  const base = `http://localhost:${process.env.API_PORT || 4000}`;
  const manifest = await buildRuntimeModuleManifest(
    c.req.param('tenantId'),
    c.req.param('siteId'),
    base,
  );
  return c.json(manifest);
});

app.post('/api/v1/t/:tenantId/sites/:siteId/modules/:moduleId/toggle', requireAdmin, async (c) => {
  const { enabled } = await c.req.json();
  const result = await setModuleEnabled(
    c.req.param('tenantId'),
    c.req.param('siteId'),
    c.req.param('moduleId'),
    enabled !== false,
  );
  return c.json(result);
});

/** Install .forgepkg: { manifest, bundle } */
app.post('/api/v1/t/:tenantId/sites/:siteId/modules/install', requireAdmin, async (c) => {
  const body = await c.req.json();
  const result = await installModulePackage(body);
  if (!result.ok) return c.json(result, 400);

  await setModuleEnabled(c.req.param('tenantId'), c.req.param('siteId'), result.id, true);
  return c.json(result);
});

/** Serve ESM bundle for dynamic import in runtime */
app.get('/api/v1/modules/:moduleId/:version/bundle.js', async (c) => {
  const bp = bundlePath(c.req.param('moduleId'), c.req.param('version'));
  if (!fs.existsSync(bp)) return c.text('// not found', 404);
  const code = fs.readFileSync(bp, 'utf-8');
  return c.body(code, 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=60',
  });
});

// ── Bootstrap ───────────────────────────────────────────────────────

const port = Number(process.env.API_PORT || 4000);

try {
  await ensureBootstrap();
  console.log('✅ Bootstrap tenant/site ready');
  await seedBuiltinModules();
} catch (e) {
  console.warn('⚠️  Bootstrap skipped (DB not ready?):', e.message);
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`🔥 Forge API http://localhost:${port}`);
});
