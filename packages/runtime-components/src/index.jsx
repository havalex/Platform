import React, { useReducer, useEffect } from 'react';
import { createSignalReducer, getCoreRegistry } from './registry.jsx';
import { resolveShell } from './shells.jsx';

export { CORE_REGISTRY, getCoreRegistry, createSignalReducer } from './registry.jsx';
export { DefaultShell, SidebarShell, resolveShell, SHELLS } from './shells.jsx';

function resolveTemplate(str, state) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const parts = expr.trim().split('.');
    let cur = state;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) return '';
    }
    return String(cur);
  });
}

function RenderNodeFixed({ node, registry, dispatch, shared }) {
  const Comp = registry[node.type];
  if (!Comp) return <div style={{ border: '1px dashed #f59e0b', padding: 8 }}>Unknown: {node.type}</div>;

  const props = { ...node };
  delete props.type;
  delete props.children;
  delete props.id;
  delete props.tabs;

  if (typeof props.content === 'string') props.content = resolveTemplate(props.content, shared);
  if (typeof props.label === 'string') props.label = resolveTemplate(props.label, shared);
  if (node.type === 'TodoList') {
    props.shared = shared;
    props.dispatch = dispatch;
  }

  if (node.type === 'Tabs' && node.tabs) {
    const tabsWithRendered = node.tabs.map(tab => ({
      ...tab,
      children: tab.children?.map((child, i) => (
        <RenderNodeFixed key={child.id || i} node={child} registry={registry} dispatch={dispatch} shared={shared} />
      )),
    }));
    return <Comp {...props} tabs={tabsWithRendered} onEmit={a => dispatch(a)} />;
  }

  const children = node.children?.map((child, i) => (
    <RenderNodeFixed key={child.id || i} node={child} registry={registry} dispatch={dispatch} shared={shared} />
  ));

  return <Comp {...props} onEmit={a => dispatch(a)}>{children}</Comp>;
}

export function ManifestRenderer({ page, extraRegistry = {} }) {
  const registry = { ...CORE_REGISTRY, ...extraRegistry };
  const reducer = createSignalReducer(page);
  const [shared, dispatch] = useReducer(reducer, () => {
    const s = {};
    for (const [k, t] of Object.entries(page.sharedState || {})) {
      s[k] = { string: '', number: 0, boolean: false, array: [], object: {} }[t] ?? '';
    }
    return { ...s, _lastEvent: null };
  });

  useEffect(() => {
    if (!page.storage?.key) return;
    try {
      const raw = localStorage.getItem(page.storage.key);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.keys(parsed).forEach(k => { shared[k] = parsed[k]; });
      }
    } catch { /* ignore */ }
  }, [page.storage?.key]);

  useEffect(() => {
    if (!page.storage?.key) return;
    const toSave = { ...shared };
    delete toSave._lastEvent;
    localStorage.setItem(page.storage.key, JSON.stringify(toSave));
  }, [shared, page.storage?.key]);

  return (
    <div className="forge-page">
      {page.components?.map((c, i) => (
        <RenderNodeFixed key={c.id || i} node={c} registry={registry} dispatch={dispatch} shared={shared} />
      ))}
    </div>
  );
}

export function ForgeApp({ manifest, extraRegistry }) {
  const Shell = resolveShell(manifest);
  return (
    <Shell appName={manifest.appName} pages={manifest.pages}>
      {/* Router wraps per-page in apps/runtime */}
    </Shell>
  );
}
