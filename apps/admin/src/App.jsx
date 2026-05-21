import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import { resolver, PALETTE_GROUPS } from './craft/resolver.jsx';
import { PropertiesPanel } from './craft/PropertiesPanel.jsx';
import { importPageToCraft, syncManifestPage } from '@forge/manifest-bridge';
import { loadDraft, saveDraft, publishSite, addPage, removePage } from './api.js';
import { useToast, Toast } from './hooks/useToast.jsx';
import { PageModal } from './components/PageModal.jsx';
import { ModulesPanel } from './components/ModulesPanel.jsx';
import {
  Save, Globe, Plus, Trash2, Download, Upload, ExternalLink,
  PanelLeft, Package,
} from 'lucide-react';

const RUNTIME_PREVIEW = import.meta.env.VITE_FORGE_RUNTIME_URL || 'http://localhost:5174';
const AUTOSAVE_MS = 4000;

function Palette() {
  const { connectors } = useEditor();
  return (
    <aside style={{ width: 200, borderRight: '1px solid #e5e7eb', padding: 12, background: '#fafafa', overflow: 'auto' }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginBottom: 12 }}>Components</h3>
      {PALETTE_GROUPS.map(group => (
        <div key={group.name} style={{ marginBottom: 12 }}>
          <div className="forge-sidebar-label" style={{ padding: '0 0 6px' }}>{group.name}</div>
          {group.types.map(type => {
            const Comp = resolver[type];
            if (!Comp) return null;
            return (
              <div
                key={type}
                ref={ref => connectors.create(ref, <Comp />)}
                className="forge-palette-item"
              >
                {type}
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

function EditorCanvas({ page, canvasKey }) {
  const { actions } = useEditor();

  useEffect(() => {
    const data = importPageToCraft(page);
    if (data) actions.deserialize(JSON.stringify(data));
  }, [canvasKey, actions, page]);

  return (
    <div className="forge-canvas-wrap">
      <Frame>
        <Element is={resolver.CraftRoot} canvas />
      </Frame>
    </div>
  );
}

function Toolbar({
  manifest, setManifest, revision, setRevision,
  pageIndex, setPageIndex,   dirty, setDirty,
  syncFromCanvas, toast,
}) {
  const fileRef = useRef(null);
  const [pageModal, setPageModal] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const doSave = async (silent = false) => {
    setSaving(true);
    try {
      const m = syncFromCanvas();
      const res = await saveDraft(m, revision);
      setManifest(m);
      setRevision(res.revision);
      setDirty(false);
      if (!silent) toast.show('Draft saved', 'ok');
      return true;
    } catch (e) {
      toast.show(e.message, 'err');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const m = syncFromCanvas();
      const saveRes = await saveDraft(m, revision);
      const pubRes = await publishSite();
      setManifest(m);
      setRevision(pubRes.revision ?? saveRes.revision);
      setDirty(false);
      toast.show('Published — live app updated', 'ok');
    } catch (e) {
      toast.show(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const m = syncFromCanvas();
    const json = JSON.stringify(m, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(m.appName || 'app').replace(/\s+/g, '-').toLowerCase()}-manifest.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    navigator.clipboard?.writeText(json);
    toast.show('Manifest exported & copied', 'ok');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const m = JSON.parse(ev.target.result);
        if (!m.pages?.length) throw new Error('Invalid manifest: missing pages');
        const res = await saveDraft(m, revision);
        setManifest(m);
        setRevision(res.revision);
        setDirty(false);
        setPageIndex(0);
        toast.show('Manifest imported', 'ok');
      } catch (err) {
        toast.show(err.message, 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddPage = async (page) => {
    try {
      if (dirty) await doSave(true);
      const m = await addPage(page);
      setManifest(m);
      setPageIndex(m.pages.length - 1);
      toast.show(`Page "${page.title}" added`, 'ok');
    } catch (e) {
      toast.show(e.message, 'err');
    }
  };

  const handleRemovePage = async () => {
    if (manifest.pages.length <= 1) {
      toast.show('Cannot remove the last page', 'err');
      return;
    }
    if (!confirm(`Remove "${manifest.pages[pageIndex].title}"?`)) return;
    try {
      const m = await removePage(manifest.pages[pageIndex].route);
      setManifest(m);
      setPageIndex(Math.max(0, pageIndex - 1));
      toast.show('Page removed', 'ok');
    } catch (e) {
      toast.show(e.message, 'err');
    }
  };

  const handlePageChange = async (newIndex) => {
    if (newIndex === pageIndex) return;
    if (dirty) await doSave(true);
    setPageIndex(newIndex);
  };

  const previewUrl = `${RUNTIME_PREVIEW}?preview=draft`;

  return (
    <>
      <header className="forge-toolbar">
        <PanelLeft size={18} style={{ color: '#4f46e5' }} />
        <strong style={{ color: '#4f46e5', fontSize: 14 }}>Forge</strong>
        <input
          className="forge-input"
          value={manifest.appName}
          onChange={e => { setManifest({ ...manifest, appName: e.target.value }); setDirty(true); }}
          style={{ width: 140 }}
          title="App name"
        />
        <select
          className="forge-select"
          value={manifest.shell?.moduleId || 'default'}
          onChange={e => {
            setManifest({ ...manifest, shell: { moduleId: e.target.value, props: {} } });
            setDirty(true);
          }}
          title="Shell layout"
        >
          <option value="default">Shell: Top nav</option>
          <option value="core-shell">Shell: Sidebar</option>
        </select>
        <select
          className="forge-select"
          value={pageIndex}
          onChange={e => handlePageChange(Number(e.target.value))}
        >
          {manifest.pages.map((p, i) => (
            <option key={p.route} value={i}>{p.title} ({p.route})</option>
          ))}
        </select>
        <button type="button" className="forge-btn forge-btn-ghost" onClick={() => setPageModal(true)} title="Add page"><Plus size={14} /></button>
        <button type="button" className="forge-btn forge-btn-danger" onClick={handleRemovePage} title="Remove page"><Trash2 size={14} /></button>
        <span style={{ width: 1, height: 24, background: '#e5e7eb' }} />
        <button type="button" className="forge-btn forge-btn-ghost" onClick={handleExport} title="Export JSON"><Download size={14} /></button>
        <label className="forge-btn forge-btn-ghost" style={{ cursor: 'pointer' }} title="Import JSON">
          <Upload size={14} />
          <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button type="button" className="forge-btn forge-btn-ghost" onClick={() => setModulesOpen(true)} title="Modules">
          <Package size={14} /> Modules
        </button>
        <a href={previewUrl} target="_blank" rel="noreferrer" className="forge-btn forge-btn-ghost" style={{ textDecoration: 'none' }}>
          <ExternalLink size={14} /> Preview
        </a>
        <span style={{ flex: 1 }} />
        {dirty && <span className="forge-dirty-dot" title="Unsaved changes" />}
        <button type="button" className="forge-btn forge-btn-primary" onClick={() => doSave()} disabled={saving}>
          <Save size={14} /> {saving ? '…' : 'Save'}
        </button>
        <button type="button" className="forge-btn forge-btn-success" onClick={handlePublish} disabled={saving}>
          <Globe size={14} /> Publish
        </button>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>rev {revision}</span>
      </header>
      <PageModal open={pageModal} onClose={() => setPageModal(false)} onSubmit={handleAddPage} />
      <ModulesPanel open={modulesOpen} onClose={() => setModulesOpen(false)} toast={toast} />
    </>
  );
}

function AdminEditor({
  manifest, setManifest, revision, setRevision, pageIndex, setPageIndex,
  dirty, setDirty, toast,
}) {
  const { query } = useEditor();
  const page = manifest.pages[pageIndex];
  const canvasKey = `${pageIndex}-${page?.route}-${revision}`;

  const syncFromCanvas = useCallback(() => {
    return syncManifestPage(manifest, pageIndex, query.serialize());
  }, [query, manifest, pageIndex]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      try {
        const m = syncFromCanvas();
        const res = await saveDraft(m, revision);
        setManifest(m);
        setRevision(res.revision);
        setDirty(false);
        toast.show('Autosaved', 'info');
      } catch { /* silent — user can manual save */ }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, syncFromCanvas, revision, setManifest, setRevision, setDirty, toast]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        (async () => {
          const m = syncFromCanvas();
          const res = await saveDraft(m, revision);
          setManifest(m);
          setRevision(res.revision);
          setDirty(false);
          toast.show('Saved', 'ok');
        })();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [syncFromCanvas, revision, setManifest, setRevision, setDirty, toast]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        manifest={manifest}
        setManifest={setManifest}
        revision={revision}
        setRevision={setRevision}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        dirty={dirty}
        setDirty={setDirty}
        syncFromCanvas={syncFromCanvas}
        toast={toast}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Palette />
        <EditorCanvas page={page} canvasKey={canvasKey} />
        <div style={{ display: 'flex', flexDirection: 'column', width: 220, flexShrink: 0, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
          <div className="forge-sidebar-label">Layers</div>
          <div style={{ flex: 1, overflow: 'auto', fontSize: 12 }}>
            <Layers />
          </div>
        </div>
        <PropertiesPanel onChange={() => setDirty(true)} />
      </div>
    </div>
  );
}

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [revision, setRevision] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const handleNodesChange = useCallback(() => setDirty(true), [setDirty]);

  useEffect(() => {
    loadDraft()
      .then(({ manifest: m, revision: r }) => { setManifest(m); setRevision(r); })
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 32, maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui' }}>
        <h2 style={{ color: '#b91c1c' }}>Cannot connect to API</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{error}</p>
        <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
{`cd platform/docker && docker compose up -d postgres
cd .. && pnpm db:migrate && pnpm dev:api`}
        </pre>
      </div>
    );
  }

  if (!manifest) {
    return <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading Forge Admin…</div>;
  }

  return (
    <>
      <Editor resolver={resolver} enabled onNodesChange={handleNodesChange}>
        <AdminEditor
          manifest={manifest}
          setManifest={setManifest}
          revision={revision}
          setRevision={setRevision}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          dirty={dirty}
          setDirty={setDirty}
          toast={toast}
        />
      </Editor>
      <Toast toast={toast.toast} />
    </>
  );
}
