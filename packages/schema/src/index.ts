import { z } from 'zod';
import { SCHEMA_VERSION } from '@forge/manifest-types';

const componentBase = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
}).passthrough();

type ComponentInput = z.infer<typeof componentBase> & { children?: ComponentInput[] };

const componentSchema: z.ZodType<ComponentInput> = componentBase.extend({
  children: z.lazy(() => z.array(componentSchema)).optional(),
});

export const pageSchema = z.object({
  route: z.string().min(1).describe('URL path e.g. / or /settings'),
  title: z.string().min(1),
  layout: z.enum(['default', 'wide', 'full-width', 'blank']).optional(),
  components: z.array(componentSchema),
  signals: z.array(z.string()).optional(),
  sharedState: z.record(z.enum(['string', 'number', 'boolean', 'array', 'object'])).optional(),
  storage: z.object({ key: z.string() }).optional(),
});

export const siteManifestSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  appName: z.string().min(1),
  version: z.string().optional(),
  theme: z.object({
    tokens: z.record(z.string()).optional(),
    componentDefaults: z.record(z.record(z.unknown())).optional(),
  }).optional(),
  shell: z.object({
    moduleId: z.string(),
    props: z.record(z.unknown()).optional(),
  }).optional(),
  pages: z.array(pageSchema).min(1),
  meta: z.record(z.unknown()).optional(),
});

export type SiteManifestInput = z.infer<typeof siteManifestSchema>;

export function validateManifest(data: unknown) {
  return siteManifestSchema.safeParse(data);
}
