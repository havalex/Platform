import React from 'react';
import { RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';

const ADMIN_URL = import.meta.env.VITE_FORGE_ADMIN_URL || 'http://localhost:5173';

export function PreviewBar({ mode, onModeChange, revision, onRefresh, loading }) {
  const isDraft = mode === 'draft';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
      background: isDraft ? '#fef3c7' : '#ecfdf5',
      borderBottom: `2px solid ${isDraft ? '#f59e0b' : '#10b981'}`,
      fontFamily: 'system-ui, sans-serif', fontSize: 13,
    }}>
      {isDraft ? <Eye size={16} /> : <EyeOff size={16} />}
      <span style={{ fontWeight: 600 }}>
        {isDraft ? 'Preview: draft (unsaved public changes)' : 'Live: published'}
      </span>
      <button
        type="button"
        onClick={() => onModeChange(isDraft ? 'published' : 'draft')}
        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}
      >
        Switch to {isDraft ? 'published' : 'draft'}
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12 }}
      >
        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
      </button>
      <a
        href={ADMIN_URL}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontSize: 12, marginLeft: 'auto' }}
      >
        <ExternalLink size={14} /> Open Admin
      </a>
      <span style={{ fontSize: 11, color: '#6b7280' }}>rev {revision ?? '—'}</span>
    </div>
  );
}

export function getPreviewModeFromUrl() {
  if (typeof window === 'undefined') return 'published';
  const p = new URLSearchParams(window.location.search);
  if (p.get('preview') === 'draft') return 'draft';
  const stored = localStorage.getItem('forge-preview-mode');
  return stored === 'draft' ? 'draft' : 'published';
}

export function setPreviewModeStorage(mode) {
  localStorage.setItem('forge-preview-mode', mode);
}

export function manifestUrl(mode) {
  const TENANT = import.meta.env.VITE_FORGE_TENANT || 'default';
  const SITE = import.meta.env.VITE_FORGE_SITE || 'main';
  const kind = mode === 'draft' ? 'draft' : 'published';
  return `/api/v1/t/${TENANT}/sites/${SITE}/manifest/${kind}`;
}
