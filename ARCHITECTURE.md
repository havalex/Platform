# Forge Platform — Architecture (Platform + Craft.js)

> Base platform from which **any application** can be built: SaaS dashboards, landing pages, internal tools, marketplaces.  
> **No PHP.** TypeScript + React + Node. Multi-tenant from day one.

---

## Product shape

| Layer | App / Service | Role |
|-------|---------------|------|
| **Control** | `apps/admin` | Craft.js editor, pages, logic, modules, publish |
| **Data plane** | `apps/runtime` | Public UI — renders **published** manifest + enabled modules |
| **API** | `services/api` | Tenants, sites, manifest CRUD, modules, assets, auth hooks |
| **Jobs** | `services/worker` | Publish, module install, backups, static export (optional) |
| **Packages** | `packages/*` | Shared schema, runtime components, module SDK |

```text
                    ┌─────────────┐
  Editor ──────────►│   Admin     │ Craft.js + API client
                    │  (Craft)    │
                    └──────┬──────┘
                           │ draft manifest
                           ▼
                    ┌─────────────┐
                    │     API     │◄─── AI / MCP (scoped PATCH)
                    │  multi-tenant│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         PostgreSQL      Redis        MinIO
              │
              │ published manifest + modules registry
              ▼
                    ┌─────────────┐
  Visitors ────────►│   Runtime   │ React tree from JSON
                    └─────────────┘
```

---

## Multi-tenant model

```
Tenant (org)
 └── Site (one deployable app / brand)
      ├── draft_manifest      (JSON — editor writes here)
      ├── published_manifest  (JSON — runtime reads)
      ├── revisions[]         (snapshots)
      └── enabled_modules[]   (id@version)
```

- **Tenant** = billing / isolation boundary (`tenant_id` on every row).
- **Site** = what users think of as “the app” (routes, pages, theme).
- **Module** = installable pack (components, shell, theme, routes).

API paths: `/api/v1/t/:tenantId/sites/:siteId/...`

---

## Manifest contract (application DNA)

Every app is a single JSON document (validated by Zod in `@forge/schema`):

```json
{
  "schemaVersion": "1.0.0",
  "appName": "My Product",
  "theme": { "tokens": {}, "componentDefaults": {} },
  "shell": { "moduleId": "core-shell", "props": {} },
  "pages": [
    {
      "route": "/",
      "title": "Home",
      "layout": "default",
      "components": []
    }
  ],
  "signals": {},
  "integrations": {}
}
```

- **pages[]** — unlimited routes; user adds/removes in Craft.
- **shell** — which module draws chrome (nav, sidebar); swap module = new UI skin.
- **signals / sharedState** — client logic without codegen (reducer bus).
- **integrations** — API keys live in env/DB, references only in manifest.

---

## Craft.js in admin

- **Canvas** = Craft `Editor` + `Frame` per page (or per route tab).
- **Serialize** = Craft state ↔ manifest `components[]` (same round-trip rules as exporter).
- **Layers** = `@craftjs/layers` for hierarchy (AI + user see same tree).
- **Design / Logic tabs** = layout props vs `action`, `signals`, `dataKey`.

Runtime does **not** embed Craft (smaller bundle, safer public surface).

---

## Module system (`@forge/module-sdk`)

Modules ship as **`.forgepkg`** (zip):

```
module.json          # id, version, requires.platform, permissions
dist/index.js        # ESM: export default { register(api) }
```

```ts
register(api: ForgeModuleAPI) {
  api.registerComponents({ Kanban, Chart });
  api.registerShell(EnterpriseShell);
  api.registerTheme({ tokens });
  api.registerRoutes([{ path: '/analytics', pageId: '...' }]);
}
```

| Capability | “Full functionality” |
|------------|----------------------|
| Components | Any React component bound to manifest props |
| Shell replacement | Total layout change |
| Overrides | Replace core renderers |
| Data providers | `api.registerDataSource('crm', fetcher)` |
| Auth UI | Login/register slots |
| i18n | Locale packs |

Install flow: upload → worker validates → DB row → runtime hot-reloads registry.

**No `npm install` from browser** — only signed/allowlisted packages.

---

## Edit safety (AI + humans)

- Patches scoped: `layout | content | behavior`.
- `PATCH .../components/:id` with dot-paths; never full manifest replace by default.
- Optimistic locking: `If-Match: revision`.
- Audit log table for every change.

---

## Publish pipeline

1. **Live preview** — runtime dev mode reads `draft` (auth required).
2. **Publish** — copy draft → published, bump revision, enqueue optional static build.
3. **Static export** (optional) — worker runs Vite build → MinIO → CDN path.

Default: **runtime-only** (instant). Static for edge performance at scale.

---

## Docker (Platform profile)

See `docker/docker-compose.yml`: `caddy`, `api`, `admin`, `runtime`, `worker`, `postgres`, `redis`, `minio`.

Volumes: `pg_data`, `minio_data`. Env in `.env`.

---

## Repo layout

```
platform/
  apps/admin/              # Craft.js
  apps/runtime/            # Public renderer
  services/api/            # Hono
  services/worker/         # Jobs
  packages/manifest-types/
  packages/schema/         # Zod
  packages/module-sdk/     # Plugin API types
  packages/runtime-components/
  docker/
```

---

## Phases

| Phase | Deliverable |
|-------|-------------|
| **0 (this scaffold)** | Monorepo, API, DB schema, admin Craft shell, runtime shell, Docker |
| **1** | Full component catalog + Craft round-trip |
| **2** | Module loader + example shell module |
| **3** | Auth (Better Auth), RBAC per site |
| **4** | Worker publish + static export |
| **5** | MCP tools → API only |

---

## Relation to `ui-projector` (legacy)

Optional port: Zod component schemas, semantic validator, MCP patterns.  
**Forge does not depend on codegen** for day-to-day editing.
