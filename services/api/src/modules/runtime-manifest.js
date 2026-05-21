import { listSiteModules, getSite } from '../store.js';
import { listPlatformModules } from './install.js';
import { bundlePath } from './paths.js';
import fs from 'node:fs';

const BUILTIN_CATALOG = [
  { id: 'core-shell', name: 'Sidebar Shell', version: '1.0.0', builtin: true, permissions: ['shell'] },
  { id: 'forge-blocks', name: 'Forge Blocks', version: '1.0.0', builtin: true, permissions: ['components'] },
];

/**
 * Runtime bootstrap: which modules are enabled + URLs to load ESM bundles + component type names
 */
export async function buildRuntimeModuleManifest(tenantId, siteId, baseUrl = '') {
  const site = await getSite(tenantId, siteId);
  const installed = await listSiteModules(tenantId, siteId);
  const platform = await listPlatformModules();

  const enabledIds = new Set(
    installed.filter(m => m.enabled).map(m => m.id),
  );

  // Shell from site manifest overrides
  const shellModuleId = site?.draft_manifest?.shell?.moduleId
    || site?.published_manifest?.shell?.moduleId
    || 'default';

  const modules = [];
  const componentTypes = [];
  const overrides = [];

  for (const mod of platform) {
    if (!enabledIds.has(mod.id)) continue;
    const m = mod.manifest;
    const bp = bundlePath(mod.id, mod.version);
    if (!fs.existsSync(bp)) continue;

    const bundleUrl = `${baseUrl}/api/v1/modules/${mod.id}/${mod.version}/bundle.js`;
    const entry = {
      id: mod.id,
      version: mod.version,
      name: m.name,
      bundleUrl,
      permissions: m.permissions || [],
      components: m.components || [],
      providesShell: m.permissions?.includes('shell') || mod.id === 'core-shell',
    };
    modules.push(entry);

    for (const c of m.components || []) {
      componentTypes.push({ type: c, moduleId: mod.id });
    }
  }

  return {
    platformVersion: '0.1.0',
    shellModuleId: shellModuleId === 'default' ? null : shellModuleId,
    modules,
    componentTypes,
    catalog: BUILTIN_CATALOG,
  };
}
