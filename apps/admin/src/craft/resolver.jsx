import React from 'react';
import { useNode } from '@craftjs/core';
import * as Icons from 'lucide-react';
import { CraftRoot } from './CraftRoot.jsx';
import { PALETTE_GROUPS } from '@forge/component-catalog';

const Icon = ({ name, size = 14 }) => {
  if (!name) return null;
  const I = Icons[name];
  return I ? <I size={size} /> : <span style={{ fontSize: 10 }}>?</span>;
};

const wrap = (Render, defaults = {}, opts = {}) => {
  const Wrapped = React.forwardRef((props, ref) => {
    const { connectors: { connect, drag }, selected } = useNode(s => ({ selected: s.events.selected }));
    const p = { ...defaults, ...props };
    return (
      <div
        ref={dom => { connect(drag(dom)); if (ref) typeof ref === 'function' ? ref(dom) : (ref.current = dom); }}
        style={{ position: 'relative', outline: selected ? '2px solid #4f46e5' : undefined, borderRadius: 4 }}
      >
        <Render {...p} />
      </div>
    );
  });
  Wrapped.craft = {
    displayName: opts.displayName || defaults.displayName || 'Component',
    props: defaults,
    rules: { canDrag: () => true, ...(opts.rules || {}) },
  };
  return Wrapped;
};

const canvasWrap = (Render, defaults = {}, displayName) => {
  const Wrapped = ({ children, ...props }) => {
    const { connectors: { connect, drag }, selected } = useNode(s => ({ selected: s.events.selected }));
    return (
      <div
        ref={dom => connect(drag(dom))}
        style={{ outline: selected ? '2px solid #4f46e5' : undefined, borderRadius: 4 }}
      >
        <Render {...defaults} {...props}>{children}</Render>
      </div>
    );
  };
  Wrapped.craft = {
    displayName: displayName || defaults.displayName,
    props: defaults,
    rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  };
  return Wrapped;
};

export const Text = wrap(({ content = 'Text', variant = 'body' }) => {
  const s = { heading: 24, subheading: 18, body: 14, muted: 13, lead: 15, small: 11 };
  return <p style={{ fontSize: s[variant] || 14, fontWeight: variant === 'heading' ? 700 : 400, margin: 0 }}>{content}</p>;
}, { content: 'Text', variant: 'body' }, { displayName: 'Text' });

export const Badge = wrap(({ label = 'Badge', color = 'gray', icon }) => {
  const map = { gray: ['#e5e7eb', '#374151'], blue: ['#bfdbfe', '#1d4ed8'], green: ['#bbf7d0', '#15803d'], red: ['#fecaca', '#b91c1c'] };
  const [bg, fg] = map[color] || map.gray;
  return <span style={{ display: 'inline-flex', gap: 4, padding: '2px 8px', borderRadius: 999, background: bg, color: fg, fontSize: 11 }}><Icon name={icon} size={10} />{label}</span>;
}, { label: 'Badge', color: 'gray' }, { displayName: 'Badge' });

export const Button = wrap(({ label = 'Button', icon }) => (
  <button type="button" style={{ display: 'inline-flex', gap: 6, padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13 }}>
    <Icon name={icon} />{label}
  </button>
), { label: 'Button' }, { displayName: 'Button' });

export const Input = wrap(({ label, placeholder = 'Placeholder...', id }) => (
  <div><label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
    <input id={id} readOnly placeholder={placeholder} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} /></div>
), { placeholder: 'Placeholder...' }, { displayName: 'Input' });

export const TextArea = wrap(({ label = 'Label', placeholder, rows = 3 }) => (
  <div><label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
    <textarea readOnly rows={rows} placeholder={placeholder} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} /></div>
), { label: 'Label', rows: 3 }, { displayName: 'TextArea' });

export const Select = wrap(({ label = 'Select', options = [{ value: 'a', label: 'A' }] }) => (
  <div><label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
    <select disabled style={{ width: '100%', padding: 8, borderRadius: 6 }}><option>{options[0]?.label}</option></select></div>
), { label: 'Select', options: [{ value: 'a', label: 'Option A' }] }, { displayName: 'Select' });

export const Checkbox = wrap(({ label = 'Checkbox', defaultChecked }) => (
  <label style={{ display: 'flex', gap: 8, fontSize: 13 }}><input type="checkbox" readOnly checked={defaultChecked} />{label}</label>
), { label: 'Checkbox' }, { displayName: 'Checkbox' });

export const Flex = canvasWrap(({ direction = 'col', gap = 4, children }) => (
  <div style={{ display: 'flex', flexDirection: direction === 'row' ? 'row' : 'column', gap: gap * 4, padding: 8, border: '1px dashed #cbd5e1', borderRadius: 8, minHeight: 48 }}>{children}</div>
), { direction: 'col', gap: 4 }, 'Flex');

export const Grid = canvasWrap(({ cols = 3, gap = 4, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: gap * 4, padding: 8, border: '1px dashed #cbd5e1', borderRadius: 8, minHeight: 48 }}>{children}</div>
), { cols: 3, gap: 4 }, 'Grid');

export const Card = canvasWrap(({ title = 'Card', subtitle, children }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fff', minHeight: 48 }}>
    <b style={{ fontSize: 14 }}>{title}</b>{subtitle && <p style={{ fontSize: 11, color: '#888' }}>{subtitle}</p>}<div style={{ marginTop: 8 }}>{children}</div>
  </div>
), { title: 'Card' }, 'Card');

export const Section = canvasWrap(({ title = 'Section', description, children }) => (
  <div style={{ padding: 8, minHeight: 48 }}>
    <b style={{ fontSize: 15 }}>{title}</b>{description && <p style={{ fontSize: 12, color: '#888' }}>{description}</p>}<div>{children}</div>
  </div>
), { title: 'Section' }, 'Section');

export const Form = canvasWrap(({ submitLabel = 'Submit', children }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fff' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    <button type="button" style={{ marginTop: 12, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8 }}>{submitLabel}</button>
  </div>
), { submitLabel: 'Submit' }, 'Form');

export const Modal = canvasWrap(({ triggerLabel = 'Open', title = 'Modal', children }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
    <button type="button" style={{ padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6 }}>{triggerLabel}</button>
    <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', borderRadius: 6 }}><b>{title}</b><div>{children}</div></div>
  </div>
), { triggerLabel: 'Open', title: 'Modal' }, 'Modal');

export const Tabs = canvasWrap(({ tabs = [{ label: 'Tab 1' }, { label: 'Tab 2' }] }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>{tabs.map((t, i) => (
      <span key={i} style={{ padding: '6px 12px', background: i === 0 ? '#ede9fe' : '#f3f4f6', borderRadius: 6, fontSize: 12 }}>{t.label}</span>
    ))}</div>
    <div style={{ padding: 8, border: '1px dashed #ddd', borderRadius: 6, fontSize: 12, color: '#999' }}>Drop in first tab</div>
  </div>
), { tabs: [{ label: 'Tab 1' }, { label: 'Tab 2' }] }, 'Tabs');

export const Table = wrap(({ columns = [{ key: 'name', label: 'Name' }], emptyMessage = 'No data' }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: 'left', padding: 8, background: '#f9fafb' }}>{c.label}</th>)}</tr></thead>
    <tbody><tr><td colSpan={columns.length} style={{ padding: 16, textAlign: 'center', color: '#999' }}>{emptyMessage}</td></tr></tbody></table>
), { columns: [{ key: 'name', label: 'Name' }] }, { displayName: 'Table' });

export const Alert = wrap(({ variant = 'info', title, message = 'Alert' }) => {
  const c = { info: '#dbeafe', success: '#d1fae5', warning: '#fef3c7', error: '#fee2e2' }[variant] || '#dbeafe';
  return <div style={{ padding: 10, borderRadius: 8, background: c, fontSize: 12 }}>{title && <b>{title}: </b>}{message}</div>;
}, { variant: 'info', message: 'Alert' }, { displayName: 'Alert' });

export const StatCard = wrap(({ label = 'Users', value = '1,234', trend, color = 'indigo' }) => {
  const colors = { indigo: '#4f46e5', green: '#059669', red: '#dc2626', amber: '#d97706' };
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, borderLeft: `4px solid ${colors[color] || colors.indigo}` }}>
      <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {trend && <div style={{ fontSize: 11, color: '#059669' }}>{trend}</div>}
    </div>
  );
}, { label: 'Users', value: '1,234' }, { displayName: 'StatCard' });

export const Highlight = wrap(({ title = 'Tip', body = 'Message', variant = 'info' }) => {
  const bg = { info: '#eff6ff', success: '#ecfdf5', warning: '#fffbeb' }[variant] || '#eff6ff';
  return <div style={{ padding: 12, borderRadius: 8, background: bg }}><b>{title}</b><p style={{ margin: '4px 0 0', fontSize: 13 }}>{body}</p></div>;
}, { title: 'Tip', body: 'Message' }, { displayName: 'Highlight' });

export const TodoList = wrap(({ dataKey = 'todos', emptyMessage = 'No tasks' }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, fontSize: 12 }}>
    <div style={{ padding: 8, background: '#f3f4f6', borderRadius: 6 }}>Sample task</div>
    <p style={{ textAlign: 'center', color: '#999', marginTop: 8 }}>{emptyMessage} · {dataKey}</p>
  </div>
), { dataKey: 'todos' }, { displayName: 'TodoList' });

export const resolver = {
  CraftRoot,
  Text, Badge, Button, Input, TextArea, Select, Checkbox,
  Flex, Grid, Card, Section, Form, Modal, Tabs, Table, Alert, TodoList,
  StatCard, Highlight,
};

export { PALETTE_GROUPS };
