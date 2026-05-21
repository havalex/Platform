# Forge Platform — Progress

## Faza 1 ✅ (2026-05-21)

- **@forge/manifest-bridge** — export/import Craft serialize ↔ manifest pages (Tabs, Form, signals)
- **@forge/component-catalog** — palette groups + property field schemas
- **@forge/runtime-components** — 17 component types + signal reducer + DefaultShell + SidebarShell (`core-shell`)
- **Admin** — full Craft resolver, Layers, PropertiesPanel, multi-page select, add/remove page
- **API** — `POST/DELETE .../pages`
- **Runtime** — resolveShell from manifest, poll published manifest every 8s

## Polish ✅

- Admin: export/import JSON, autosave (4s), Ctrl+S, dirty indicator, shell selector, page modal, preview link, toasts
- Runtime: draft/published toggle bar, `?preview=draft`, refresh, link to admin
- Shared CSS, better error screens

## Faza 2 ✅

- **`.forgepkg`** format: `{ manifest, bundle }` — bundle ESM cu `api.React`
- **Install API**: `POST .../modules/install`
- **Bundle serve**: `GET /api/v1/modules/:id/:version/bundle.js`
- **Runtime loader**: dynamic `import()` + merge registry + shell
- **Built-in modules**: `core-shell`, `forge-blocks` (StatCard, Highlight)
- **Admin**: Modules panel (enable/disable, upload)
- **DB**: `platform_modules` table

## Next (Faza 3)

- Better Auth + RBAC
- Worker queue pentru install async
- Vite build pipeline pentru module (nu bundle manual)
