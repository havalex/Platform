/** Core manifest types — shared across API, admin, runtime, modules */

export const SCHEMA_VERSION = '1.0.0';

export type ManifestComponent = {
  type: string;
  id: string;
  children?: ManifestComponent[];
  [key: string]: unknown;
};

export type ManifestPage = {
  route: string;
  title: string;
  layout?: 'default' | 'wide' | 'full-width' | 'blank';
  components: ManifestComponent[];
  signals?: string[];
  sharedState?: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>;
  storage?: { key: string };
};

export type ManifestTheme = {
  tokens?: Record<string, string>;
  componentDefaults?: Record<string, Record<string, unknown>>;
};

export type ManifestShell = {
  moduleId: string;
  props?: Record<string, unknown>;
};

export type SiteManifest = {
  schemaVersion: string;
  appName: string;
  version?: string;
  theme?: ManifestTheme;
  shell?: ManifestShell;
  pages: ManifestPage[];
  meta?: Record<string, unknown>;
};

export type EnabledModule = {
  id: string;
  version: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

export const EMPTY_MANIFEST: SiteManifest = {
  schemaVersion: SCHEMA_VERSION,
  appName: 'New Application',
  theme: { tokens: { primary: 'indigo' }, componentDefaults: {} },
  shell: { moduleId: 'core-shell', props: {} },
  pages: [
    {
      route: '/',
      title: 'Home',
      layout: 'default',
      components: [
        { type: 'Section', id: 'hero', title: 'Welcome', children: [
          { type: 'Text', id: 'hero_text', content: 'Build anything on Forge.', variant: 'heading' },
          { type: 'Button', id: 'cta', label: 'Get started', className: 'bg-indigo-600 text-white px-4 py-2 rounded' },
        ]},
      ],
    },
  ],
};
