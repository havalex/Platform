import React from 'react';
import { createModuleAPI } from '@forge/module-sdk';
import { CORE_REGISTRY } from '@forge/runtime-components';
import { SHELLS, DefaultShell } from '@forge/runtime-components';

const TENANT = import.meta.env.VITE_FORGE_TENANT || 'default';
const SITE = import.meta.env.VITE_FORGE_SITE || 'main';

/**
 * Load enabled modules: dynamic import ESM bundles from API, merge registries.
 */
export async function loadModuleRegistry(siteManifest) {
  const res = await fetch(`/api/v1/t/${TENANT}/sites/${SITE}/modules/runtime`);
  if (!res.ok) throw new Error('Failed to load module manifest');
  const meta = await res.json();

  const components = { ...CORE_REGISTRY };
  let Shell = DefaultShell;
  const routes = [];

  for (const mod of meta.modules || []) {
    try {
      const modExports = await import(/* @vite-ignore */ mod.bundleUrl);
      const register = modExports.register || modExports.default?.register;
      if (!register) continue;

      const { api, getRegistry } = createModuleAPI(meta.platformVersion, React);
      await register(api);
      const reg = getRegistry();

      for (const [type, Comp] of reg.components) {
        components[type] = Comp;
      }
      for (const [type, Comp] of reg.overrides) {
        components[type] = Comp;
      }
      if (reg.shell && (meta.shellModuleId === mod.id || mod.providesShell)) {
        Shell = reg.shell;
      }
      routes.push(...reg.routes);
    } catch (e) {
      console.warn(`[Forge] Module ${mod.id} failed to load:`, e);
    }
  }

  // Fallback: built-in shell map when bundle didn't register shell
  if (meta.shellModuleId && SHELLS[meta.shellModuleId]) {
    Shell = SHELLS[meta.shellModuleId];
  }

  return { components, Shell, routes, meta };
}
