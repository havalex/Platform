import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ManifestRenderer } from '@forge/runtime-components';
import { loadModuleRegistry } from './loadModules.jsx';
import {
  PreviewBar, getPreviewModeFromUrl, setPreviewModeStorage, manifestUrl,
} from './PreviewBar.jsx';
import './styles.css';

function AppRoutes({ manifest, components, Shell }) {
  const loc = useLocation();

  return (
    <div style={{ paddingTop: 48 }}>
      <Shell appName={manifest.appName} pages={manifest.pages} currentRoute={loc.pathname}>
        <Routes>
          {manifest.pages.map(page => (
            <Route key={page.route} path={page.route} element={<ManifestRenderer page={page} extraRegistry={components} />} />
          ))}
          {manifest.pages[0] && (
            <Route path="*" element={<ManifestRenderer page={manifest.pages[0]} extraRegistry={components} />} />
          )}
        </Routes>
      </Shell>
    </div>
  );
}

function ForgeRuntime() {
  const [mode, setMode] = useState(getPreviewModeFromUrl);
  const [manifest, setManifest] = useState(null);
  const [components, setComponents] = useState(null);
  const [Shell, setShell] = useState(null);
  const [revision, setRevision] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(manifestUrl(mode));
      if (!r.ok) {
        const t = await r.text();
        throw new Error(r.status === 404 ? 'Site not found' : t);
      }
      const d = await r.json();
      setManifest(d.manifest);
      setRevision(d.revision);

      const { components: comps, Shell: Sh } = await loadModuleRegistry(d.manifest);
      setComponents(comps);
      setShell(() => Sh);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  const handleModeChange = (next) => {
    setPreviewModeStorage(next);
    setMode(next);
    const url = new URL(window.location.href);
    if (next === 'draft') url.searchParams.set('preview', 'draft');
    else url.searchParams.delete('preview');
    window.history.replaceState({}, '', url);
  };

  if (err) {
    return (
      <>
        <PreviewBar mode={mode} onModeChange={handleModeChange} revision={revision} onRefresh={load} loading={loading} />
        <div style={{ padding: 48, fontFamily: 'system-ui', maxWidth: 420, margin: '0 auto' }}>
          <h2 style={{ color: '#b91c1c' }}>Failed to load app</h2>
          <p style={{ color: '#6b7280' }}>{err}</p>
        </div>
      </>
    );
  }

  if (!manifest || !components || !Shell) {
    return (
      <>
        <PreviewBar mode={mode} onModeChange={handleModeChange} revision={revision} onRefresh={load} loading={loading} />
        <p style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading modules…</p>
      </>
    );
  }

  return (
    <BrowserRouter>
      <PreviewBar mode={mode} onModeChange={handleModeChange} revision={revision} onRefresh={load} loading={loading} />
      <AppRoutes manifest={manifest} components={components} Shell={Shell} />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<ForgeRuntime />);
