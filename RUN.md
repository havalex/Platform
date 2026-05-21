# Cum rulezi Forge Platform (Windows / Mac / Linux)

## Cerințe

| Tool | Versiune |
|------|----------|
| **Node.js** | 20+ |
| **pnpm** | 9+ (`npm install -g pnpm`) |
| **Docker Desktop** | pentru PostgreSQL (obligatoriu pentru API) — [instalare](https://www.docker.com/products/docker-desktop/) |

> Fără Docker: instalează PostgreSQL local și setează `DATABASE_URL` în `platform/.env` (ex: `postgres://user:pass@localhost:5432/forge`).

---

## Varianta rapidă (recomandat pentru dev)

### 1. Pornește baza de date

```powershell
cd c:\Users\Alex\Documents\GitHub\ui-projector\platform\docker
docker compose up -d postgres
```

Așteaptă ~10 secunde până Postgres e healthy.

### 2. Instalează dependențele (o singură dată)

```powershell
cd c:\Users\Alex\Documents\GitHub\ui-projector\platform
pnpm install
```

### 3. Migrează DB + pornește tot

**Opțiunea A — un singur terminal:**

```powershell
cd c:\Users\Alex\Documents\GitHub\ui-projector\platform
pnpm db:migrate
pnpm dev:all
```

**Opțiunea B — 3 terminale separate:**

```powershell
# Terminal 1 — API
cd platform
pnpm db:migrate
pnpm dev:api

# Terminal 2 — Admin (Craft.js)
pnpm dev:admin

# Terminal 3 — Runtime (app publică)
pnpm dev:runtime
```

### 4. Deschide în browser

| URL | Ce este |
|-----|---------|
| http://localhost:5173 | **Admin** — editor Craft (drag & drop) |
| http://localhost:5174 | **Runtime** — aplicația live |
| http://localhost:5174?preview=draft | Preview modificări nesalvate public |
| http://localhost:4000/health | API health check |

---

## Flux de lucru

1. **Admin** → tragi componente pe canvas → **Save** (sau autosave)
2. **Preview** (buton din Admin) → vezi draft în runtime (bară galbenă)
3. **Publish** → runtime pe **published** (bară verde) = ce văd „vizitatorii”

### Shell sidebar

În Admin, dropdown **Shell: Sidebar** → Save → Publish → runtime cu meniu lateral violet.

### Module (Faza 2)

1. **Admin** → buton **Modules** → vezi `core-shell`, `forge-blocks`
2. **forge-blocks** ON → în palette apar **StatCard**, **Highlight**
3. **Install** → upload `modules/example.forgepkg.json` (redenumește în `.forgepkg` sau selectează ca JSON)
4. Runtime încarcă bundle-uri de la `http://localhost:4000/api/v1/modules/.../bundle.js`

---

## Variabile opționale

Copiază `platform/.env.example` în `platform/.env` (pentru API local):

```env
DATABASE_URL=postgres://forge:forge@localhost:5432/forge
FORGE_ADMIN_API_KEY=dev-change-me
```

Pentru Admin/Runtime (opțional, `apps/admin/.env`):

```env
VITE_FORGE_API_KEY=dev-change-me
VITE_FORGE_RUNTIME_URL=http://localhost:5174
```

---

## Docker complet (API în container)

```powershell
cd platform\docker
docker compose up -d postgres api
```

Apoi pe host doar UI-urile:

```powershell
cd platform
pnpm install
pnpm dev:admin
pnpm dev:runtime
```

API va fi la http://localhost:4000 (proxy Vite către `/api` merge automat în dev).

---

## Probleme frecvente

| Problemă | Soluție |
|----------|---------|
| `API error` / connection refused | `docker compose up -d postgres` apoi `pnpm db:migrate` |
| `REVISION_CONFLICT` | Refresh Admin (F5), Save din nou |
| Runtime gol | Apasă **Publish** în Admin, apoi Refresh în runtime |
| `pnpm` nu există | `npm install -g pnpm` |
| Port ocupat | Oprește procesul pe 4000/5173/5174 sau schimbă portul în `vite.config.js` |

---

## Comenzi utile

```powershell
pnpm db:migrate      # aplică schema Postgres
pnpm dev:all         # API + Admin + Runtime
pnpm dev:api         # doar API
pnpm build           # build producție
```
