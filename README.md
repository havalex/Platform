# Forge Platform

**Multi-tenant UI platform** — baza de la care poate pleca orice aplicație.

- **Craft.js** admin (drag-drop, layers, pagini multiple)
- **Runtime React** din manifest JSON (fără rebuild la fiecare salvare)
- **Module SDK** — shell, componente, theme, routes (`.forgepkg`)
- **PostgreSQL** — tenants, sites, draft/published, revisions, audit
- **Docker** — Postgres, Redis, MinIO, API, Worker, Caddy
- **Fără PHP**

## Quick start (local)

**Ghid complet:** [RUN.md](./RUN.md) (română, Windows + Docker)

```powershell
cd platform\docker
docker compose up -d postgres

cd ..
pnpm install
pnpm db:migrate
pnpm dev:all
```

Sau un singur script: `.\scripts\start-dev.ps1`

| URL | Rol |
|-----|-----|
| http://localhost:5173 | **Admin** — editor Craft |
| http://localhost:5174 | **Runtime** — app publicată |
| http://localhost:4000/health | API |

**Flow:** Admin → Save draft → **Publish** → Runtime reîncarcă manifest published.

### Polish (UX)

| Admin | Runtime |
|-------|---------|
| Export / Import JSON | Bară **draft ↔ published** |
| Autosave la 4s + **Ctrl+S** | `?preview=draft` în URL |
| Indicator modificări nesalvate | Refresh manual |
| Selector **shell** (top nav / sidebar) | Link către Admin |
| Modal pagină nouă | Persistență mod în `localStorage` |
| **Preview** → runtime draft | |

Env admin (`apps/admin/.env` opțional):

```env
VITE_FORGE_TENANT=default
VITE_FORGE_SITE=main
VITE_FORGE_API_KEY=dev-change-me
```

## API (multi-tenant)

```
GET  /api/v1/t/:tenantId/sites/:siteId/manifest/draft
PUT  /api/v1/t/:tenantId/sites/:siteId/manifest/draft   (X-Forge-Api-Key)
PATCH .../manifest/draft/components/:id                 (scoped patch, AI-safe)
GET  /api/v1/t/:tenantId/sites/:siteId/manifest/published
POST /api/v1/t/:tenantId/sites/:siteId/publish
```

## Module (schimbă tot UI-ul)

Vezi `@forge/module-sdk` și `ARCHITECTURE.md`.

```js
register(api) {
  api.registerShell(MyEnterpriseShell);
  api.registerComponents({ Kanban, Chart });
}
```

## Structură

```
apps/admin      → Craft.js + Layers + Properties
apps/runtime    → Public app (published manifest)
services/api    → Hono + pages CRUD
services/worker → Jobs (stub)
packages/manifest-bridge   → Craft ↔ JSON
packages/component-catalog → Palette + field schemas
packages/runtime-components → 17 renderers + shells
packages/module-sdk
docker/
```

### Schimbă shell-ul (sidebar)

În manifest: `"shell": { "moduleId": "core-shell" }` → runtime folosește **SidebarShell**.

## Roadmap

| Fază | Conținut |
|------|----------|
| **0** ✅ | Scaffold, API, DB, Craft admin, runtime, Docker |
| **1** ✅ | 17 componente, manifest-bridge, properties panel, pages CRUD, shells |
| **2** | Module loader + install .forgepkg |
| **3** | Auth (Better Auth), RBAC |
| **4** | Worker: publish static, backups |
| **5** | MCP → API only |

## Relație cu `ui-projector`

Proiect **separat** în `platform/`. Poți porta validatoare Zod și catalog componente; Forge nu depinde de codegen zilnic.
