import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../store.js';
import { bundlePath, ensureModulesDir, moduleDir } from './paths.js';

const PLATFORM_VERSION = '0.1.0';

function parseRequires(range) {
  if (!range || typeof range !== 'string') return true;
  if (range.startsWith('^0.1.')) return PLATFORM_VERSION.startsWith('0.1.');
  if (range === '0.1.0') return PLATFORM_VERSION === '0.1.0';
  return true;
}

export function validateModuleManifest(manifest) {
  if (!manifest?.id || !manifest?.version || !manifest?.name) {
    return { ok: false, error: 'INVALID_MANIFEST', message: 'id, name, version required' };
  }
  if (!/^[a-z][a-z0-9-]*$/.test(manifest.id)) {
    return { ok: false, error: 'INVALID_ID', message: 'Module id must be kebab-case' };
  }
  if (!parseRequires(manifest.requires?.platform)) {
    return { ok: false, error: 'INCOMPATIBLE_PLATFORM', message: `Requires platform ${manifest.requires?.platform}` };
  }
  return { ok: true };
}

/**
 * Install module from .forgepkg payload: { manifest, bundle } (bundle = ESM source string)
 */
export async function installModulePackage({ manifest, bundle }) {
  const v = validateModuleManifest(manifest);
  if (!v.ok) return v;

  if (!bundle || typeof bundle !== 'string' || bundle.length < 10) {
    return { ok: false, error: 'INVALID_BUNDLE', message: 'bundle ESM source required' };
  }

  if (!bundle.includes('register')) {
    return { ok: false, error: 'INVALID_BUNDLE', message: 'bundle must export register(api)' };
  }

  ensureModulesDir();
  const dir = moduleDir(manifest.id, manifest.version);
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });

  fs.writeFileSync(path.join(dir, 'module.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(bundlePath(manifest.id, manifest.version), bundle, 'utf-8');

  const bp = bundlePath(manifest.id, manifest.version);
  await pool.query(
    `INSERT INTO platform_modules (id, version, manifest, bundle_path)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id, version) DO UPDATE SET manifest = $3, bundle_path = $4, installed_at = NOW()`,
    [manifest.id, manifest.version, JSON.stringify(manifest), bp],
  );

  return { ok: true, id: manifest.id, version: manifest.version, path: bp };
}

export async function listPlatformModules() {
  const { rows } = await pool.query(
    `SELECT id, version, manifest, installed_at FROM platform_modules ORDER BY id, version DESC`,
  );
  return rows.map(r => ({
    id: r.id,
    version: r.version,
    manifest: r.manifest,
    installedAt: r.installed_at,
  }));
}

export async function getPlatformModule(id, version) {
  const { rows } = await pool.query(
    `SELECT * FROM platform_modules WHERE id = $1 AND version = $2`,
    [id, version],
  );
  return rows[0] || null;
}
