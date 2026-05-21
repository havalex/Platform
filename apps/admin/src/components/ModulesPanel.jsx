import React, { useEffect, useState, useRef } from 'react';
import { Package, Upload, Power, PowerOff, X } from 'lucide-react';
import { fetchModules, toggleModule, installForgepkg } from '../api.js';

export function ModulesPanel({ open, onClose, toast }) {
  const [catalog, setCatalog] = useState([]);
  const [installed, setInstalled] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const reload = () => {
    setLoading(true);
    fetchModules()
      .then(d => { setCatalog(d.catalog || []); setInstalled(d.installed || []); })
      .catch(e => toast?.show(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) reload(); }, [open]);

  const isEnabled = (id) => installed.find(m => m.id === id)?.enabled;

  const handleToggle = async (id, enabled) => {
    try {
      await toggleModule(id, enabled);
      toast?.show(`${id} ${enabled ? 'enabled' : 'disabled'}`, 'ok');
      reload();
    } catch (e) {
      toast?.show(e.message, 'err');
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const pkg = JSON.parse(ev.target.result);
        if (!pkg.manifest || !pkg.bundle) throw new Error('.forgepkg needs manifest + bundle');
        await installForgepkg(pkg);
        toast?.show(`Installed ${pkg.manifest.id}@${pkg.manifest.version}`, 'ok');
        reload();
      } catch (err) {
        toast?.show(err.message, 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div className="forge-modal" style={{ width: 480, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} /> Modules</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <label className="forge-btn forge-btn-ghost" style={{ cursor: 'pointer', marginBottom: 16, display: 'inline-flex' }}>
          <Upload size={14} /> Install .forgepkg
          <input type="file" accept=".forgepkg,.json" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
        </label>

        {loading && <p style={{ fontSize: 12, color: '#888' }}>Loading…</p>}

        {catalog.map(mod => {
          const on = isEnabled(mod.id);
          return (
            <div key={mod.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{mod.name}</strong>
                  <div style={{ fontSize: 11, color: '#888' }}>{mod.id} · v{mod.version}</div>
                  {mod.components?.length > 0 && (
                    <div style={{ fontSize: 11, marginTop: 4 }}>Components: {mod.components.join(', ')}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={`forge-btn ${on ? 'forge-btn-success' : 'forge-btn-ghost'}`}
                  onClick={() => handleToggle(mod.id, !on)}
                  title={on ? 'Disable' : 'Enable'}
                >
                  {on ? <Power size={14} /> : <PowerOff size={14} />}
                  {on ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          );
        })}

        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
          .forgepkg = JSON cu <code>manifest</code> + <code>bundle</code> (ESM folosind <code>api.React</code>).
          Vezi <code>modules/example.forgepkg.json</code>.
        </p>
      </div>
    </div>
  );
}
