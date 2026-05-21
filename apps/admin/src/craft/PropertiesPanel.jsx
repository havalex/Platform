import React from 'react';
import { useEditor } from '@craftjs/core';
import { FIELD_SCHEMAS } from '@forge/component-catalog';

function getProp(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function setProp(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export function PropertiesPanel({ onChange }) {
  const { selected, actions, query } = useEditor(state => {
    let selectedId = null;
    const sel = state.events.selected;
    if (sel instanceof Set) selectedId = [...sel][0];
    else if (sel && typeof sel === 'object') selectedId = Object.keys(sel)[0];
    return { selected: selectedId };
  });

  if (!selected) {
    return (
      <div style={{ width: 260, borderLeft: '1px solid #e5e7eb', padding: 16, background: '#fff', flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 48 }}>Select a component to edit</p>
      </div>
    );
  }

  const node = query.node(selected).get();
  const typeName = node.data.type?.resolvedName || node.data.displayName || 'Unknown';
  if (typeName === 'CraftRoot') {
    return (
      <div style={{ width: 280, borderLeft: '1px solid #e5e7eb', padding: 16, background: '#fff' }}>
        <p style={{ fontSize: 12, color: '#666' }}>Page canvas root</p>
      </div>
    );
  }

  const fields = FIELD_SCHEMAS[typeName] || [];
  const props = { ...node.data.props };

  const update = (path, value) => {
    const next = structuredClone(props);
    setProp(next, path, value);
    actions.setProp(selected, cb => { Object.assign(cb, next); });
    onChange?.();
  };

  return (
    <div style={{ width: 260, padding: 12, background: '#fff', overflow: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginBottom: 12 }}>{typeName}</div>
      <div style={{ fontSize: 10, color: '#999', marginBottom: 8 }}>id: {props.id || selected}</div>
      {fields.map(f => (
        <label key={f.key} style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
          <span style={{ fontWeight: 500, color: '#555' }}>{f.label}</span>
          {f.type === 'select' ? (
            <select
              value={getProp(props, f.key) ?? ''}
              onChange={e => update(f.key, e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 6, borderRadius: 6, border: '1px solid #e5e7eb' }}
            >
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'checkbox' ? (
            <input type="checkbox" checked={!!getProp(props, f.key)} onChange={e => update(f.key, e.target.checked)} style={{ marginTop: 4 }} />
          ) : f.type === 'number' ? (
            <input type="number" value={getProp(props, f.key) ?? 0} onChange={e => update(f.key, Number(e.target.value))}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 6, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          ) : (
            <input
              type="text"
              value={getProp(props, f.key) ?? ''}
              onChange={e => update(f.key, e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 6, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
          )}
        </label>
      ))}
      {fields.length === 0 && <p style={{ fontSize: 11, color: '#999' }}>No quick fields — use Layers + duplicate</p>}
    </div>
  );
}
