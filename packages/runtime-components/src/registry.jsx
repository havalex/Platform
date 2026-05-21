import React, { useState, useReducer, useEffect } from 'react';
import * as Icons from 'lucide-react';

const Icon = ({ name, size = 16 }) => {
  const I = name && Icons[name];
  return I ? <I size={size} style={{ verticalAlign: 'middle' }} /> : null;
};

const badgeColors = {
  gray: ['#f3f4f6', '#374151'], red: ['#fee2e2', '#991b1b'], green: ['#d1fae5', '#065f46'],
  blue: ['#dbeafe', '#1e40af'], yellow: ['#fef9c3', '#854d0e'], indigo: ['#e0e7ff', '#3730a3'],
  purple: ['#f3e8ff', '#6b21a8'], pink: ['#fce7f3', '#9d174d'],
};

export const CORE_REGISTRY = {
  Text: ({ content = '', variant = 'body', className = '' }) => {
    const s = { heading: 28, subheading: 20, body: 16, muted: 14, lead: 18, small: 12 };
    return <p style={{ fontSize: s[variant] || 16, fontWeight: variant === 'heading' ? 700 : 400, margin: '0 0 8px', ...(className ? {} : {}) }} className={className}>{content}</p>;
  },

  Badge: ({ label, color = 'gray', icon }) => {
    const [bg, fg] = badgeColors[color] || badgeColors.gray;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12 }}><Icon name={icon} size={12} />{label}</span>;
  },

  Button: ({ label = 'Button', icon, className, action, onEmit }) => {
    const onClick = () => {
      if (!action) return;
      if (action.kind === 'alert') alert(action.message || label);
      if (action.kind === 'navigate') window.location.href = action.route || '/';
      if (action.kind === 'emit' && onEmit) onEmit({ type: action.signal, payload: action.payload || {} });
      if (action.kind === 'log') console.log('[Forge]', action.message || label);
    };
    const style = className ? {} : { background: '#4f46e5', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
    return <button type="button" onClick={onClick} className={className} style={style}><Icon name={icon} /> {label}</button>;
  },

  Input: ({ id, label, placeholder, className }) => {
    const [v, setV] = useState('');
    return (
      <div style={{ marginBottom: 12 }}>
        {label && <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>}
        <input id={id} value={v} onChange={e => setV(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} className={className} />
      </div>
    );
  },

  TextArea: ({ id, label, placeholder, rows = 3 }) => {
    const [v, setV] = useState('');
    return (
      <div style={{ marginBottom: 12 }}>
        {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>}
        <textarea id={id} value={v} onChange={e => setV(e.target.value)} rows={rows} placeholder={placeholder}
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
      </div>
    );
  },

  Select: ({ label, options = [], id }) => {
    const [v, setV] = useState(options[0]?.value || '');
    return (
      <div style={{ marginBottom: 12 }}>
        {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>}
        <select id={id} value={v} onChange={e => setV(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  },

  Checkbox: ({ label, defaultChecked, id }) => {
    const [c, setC] = useState(!!defaultChecked);
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
        <input id={id} type="checkbox" checked={c} onChange={e => setC(e.target.checked)} />{label}
      </label>
    );
  },

  Flex: ({ direction = 'col', gap = 4, align = 'start', children }) => (
    <div style={{ display: 'flex', flexDirection: direction === 'row' ? 'row' : 'column', gap: gap * 4, alignItems: align === 'center' ? 'center' : 'flex-start' }}>{children}</div>
  ),

  Grid: ({ cols = 3, gap = 4, children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${typeof cols === 'number' ? cols : 3}, 1fr)`, gap: gap * 4 }}>{children}</div>
  ),

  Card: ({ title, subtitle, children, accent }) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#fff', borderTop: accent ? `4px solid ${accent}` : undefined, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      {title && <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{title}</h3>}
      {subtitle && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>{subtitle}</p>}
      {children}
    </div>
  ),

  Section: ({ title, description, children }) => (
    <section style={{ marginBottom: 32 }}>
      {title && <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{title}</h2>}
      {description && <p style={{ color: '#6b7280', marginBottom: 16 }}>{description}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </section>
  ),

  Form: ({ submitLabel = 'Submit', children, onEmit }) => (
    <form onSubmit={e => { e.preventDefault(); onEmit?.({ type: 'formSubmit' }); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
      <button type="submit" style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8 }}>{submitLabel}</button>
    </form>
  ),

  Modal: ({ triggerLabel = 'Open', title = 'Modal', children }) => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button type="button" onClick={() => setOpen(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8 }}>{triggerLabel}</button>
        {open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setOpen(false)}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{title}</h3>{children}
              <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 16 }}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  },

  Tabs: ({ tabs = [], children }) => {
    const [idx, setIdx] = useState(0);
    const tabChildren = tabs.map((t, i) => t.children || (i === 0 ? children : null));
    return (
      <div>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
          {tabs.map((t, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              style={{ padding: '8px 16px', border: 'none', background: i === idx ? '#ede9fe' : 'transparent', color: i === idx ? '#4f46e5' : '#666', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div>{tabChildren[idx]}</div>
      </div>
    );
  },

  Table: ({ columns = [], rows = [], emptyMessage = 'No data', striped }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: 'left', padding: 10, background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>{c.label}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>{emptyMessage}</td></tr>
        ) : rows.map((r, i) => (
          <tr key={i} style={{ background: striped && i % 2 ? '#f9fafb' : '#fff' }}>
            {columns.map(c => <td key={c.key} style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{String(r[c.key] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ),

  Alert: ({ variant = 'info', title, message, dismissible }) => {
    const [show, setShow] = useState(true);
    const bg = { info: '#dbeafe', success: '#d1fae5', warning: '#fef3c7', error: '#fee2e2' }[variant] || '#dbeafe';
    if (!show) return null;
    return (
      <div style={{ padding: 14, borderRadius: 8, background: bg, marginBottom: 12, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>{title && <strong>{title}: </strong>}{message}</div>
        {dismissible && <button type="button" onClick={() => setShow(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button>}
      </div>
    );
  },

  TodoList: ({ dataKey = 'todos', textField = 'text', doneField = 'done', emptyMessage, shared, dispatch }) => {
    const items = shared?.[dataKey] || [];
    if (!items.length) return <p style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>{emptyMessage || 'No tasks'}</p>;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderBottom: '1px solid #f3f4f6' }}>
            <button type="button" onClick={() => dispatch({ type: `_toggle:${dataKey}:${doneField}`, payload: { index: idx } })}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              {item[doneField] ? '✓' : '○'}
            </button>
            <span style={{ textDecoration: item[doneField] ? 'line-through' : 'none', flex: 1 }}>{item[textField]}</span>
            <button type="button" onClick={() => dispatch({ type: `_remove:${dataKey}`, payload: { index: idx } })} style={{ color: '#dc2626', border: 'none', background: 'transparent' }}>Delete</button>
          </li>
        ))}
      </ul>
    );
  },
};

export function getCoreRegistry() {
  return { ...CORE_REGISTRY };
}

export function createSignalReducer(page) {
  const initial = {};
  for (const [k, t] of Object.entries(page.sharedState || {})) {
    initial[k] = { string: '', number: 0, boolean: false, array: [], object: {} }[t] ?? '';
  }
  return (state, action) => {
    const type = action.type || '';
    if (type.startsWith('_push:')) {
      const key = type.slice(6);
      return { ...state, [key]: [...(state[key] || []), action.payload] };
    }
    if (type.startsWith('_remove:')) {
      const key = type.slice(8);
      const arr = [...(state[key] || [])];
      arr.splice(action.payload?.index ?? -1, 1);
      return { ...state, [key]: arr };
    }
    if (type.startsWith('_toggle:')) {
      const [, dataKey, field] = type.split(':');
      const arr = [...(state[dataKey] || [])];
      const i = action.payload?.index ?? 0;
      if (arr[i]) arr[i] = { ...arr[i], [field]: !arr[i][field] };
      return { ...state, [dataKey]: arr };
    }
    if (type.startsWith('_clear:')) {
      const key = type.slice(7);
      return { ...state, [key]: [] };
    }
    return { ...state, _lastEvent: action };
  };
}
