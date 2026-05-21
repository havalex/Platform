const TENANT = import.meta.env.VITE_FORGE_TENANT || 'default';
const SITE = import.meta.env.VITE_FORGE_SITE || 'main';
const API_KEY = import.meta.env.VITE_FORGE_API_KEY || 'dev-change-me';
const BASE = `/api/v1/t/${TENANT}/sites/${SITE}`;

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  'X-Forge-Api-Key': API_KEY,
  ...extra,
});

export async function loadDraft() {
  const r = await fetch(`${BASE}/manifest/draft`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function saveDraft(manifest, revision) {
  const r = await fetch(`${BASE}/manifest/draft`, {
    method: 'PUT',
    headers: headers(revision != null ? { 'If-Match': String(revision) } : {}),
    body: JSON.stringify({ manifest }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function publishSite() {
  const r = await fetch(`${BASE}/publish`, { method: 'POST', headers: headers() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addPage(page) {
  const r = await fetch(`${BASE}/pages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(page),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.manifest;
}

export async function fetchModules() {
  const r = await fetch(`${BASE}/modules`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function toggleModule(moduleId, enabled) {
  const r = await fetch(`${BASE}/modules/${moduleId}/toggle`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ enabled }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function installForgepkg(pkg) {
  const r = await fetch(`${BASE}/modules/install`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(pkg),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function removePage(route) {
  const r = await fetch(`${BASE}/pages`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ route }),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.manifest;
}
