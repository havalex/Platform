/**
 * @forge/module-sdk — contract for installable platform modules.
 * Modules ship as .forgepkg (module.json + dist/index.js ESM).
 */

import type { ComponentType, ReactNode } from 'react';
import type { ManifestComponent, ManifestTheme, ManifestPage } from '@forge/manifest-types';

export type ForgePlatformVersion = `${number}.${number}.${number}`;

export type ModuleManifest = {
  id: string;
  name: string;
  version: string;
  requires: { platform: string };
  permissions?: Array<'shell' | 'components' | 'routes' | 'theme' | 'data' | 'auth'>;
};

export type RegisteredRoute = {
  path: string;
  pageId?: string;
  page?: Partial<ManifestPage>;
};

export type ComponentRegistry = Map<string, ComponentType<Record<string, unknown>>>;

export type ForgeModuleAPI = {
  platformVersion: ForgePlatformVersion;
  /** React instance — modules must use this instead of importing react */
  React: typeof import('react');

  registerComponents(components: Record<string, ComponentType<Record<string, unknown>>>): void;
  registerShell(component: ComponentType<{ children?: ReactNode; pages?: ManifestPage[] }>): void;
  registerTheme(theme: Partial<ManifestTheme>): void;
  registerRoutes(routes: RegisteredRoute[]): void;
  registerComponentOverride(type: string, component: ComponentType<ManifestComponent>): void;
  registerDataSource(id: string, resolver: (ctx: { siteId: string }) => Promise<unknown>): void;
};

export type ForgeModule = {
  manifest: ModuleManifest;
  register(api: ForgeModuleAPI): void | Promise<void>;
};

/** Build API instance for runtime/admin loader */
export function createModuleAPI(platformVersion: ForgePlatformVersion, React: typeof import('react')) {
  const components: ComponentRegistry = new Map();
  let shell: ComponentType<{ children?: ReactNode }> | null = null;
  const themes: Partial<ManifestTheme>[] = [];
  const routes: RegisteredRoute[] = [];
  const overrides = new Map<string, ComponentType<ManifestComponent>>();
  const dataSources = new Map<string, (ctx: { siteId: string }) => Promise<unknown>>();

  const api: ForgeModuleAPI = {
    platformVersion,
    React,
    registerComponents(map) {
      for (const [k, v] of Object.entries(map)) components.set(k, v);
    },
    registerShell(c) { shell = c as ComponentType<{ children?: ReactNode }>; },
    registerTheme(t) { themes.push(t); },
    registerRoutes(r) { routes.push(...r); },
    registerComponentOverride(type, c) { overrides.set(type, c); },
    registerDataSource(id, r) { dataSources.set(id, r); },
  };

  return {
    api,
    getRegistry: () => ({ components, shell, themes, routes, overrides, dataSources }),
  };
}
