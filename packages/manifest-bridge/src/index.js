/**
 * Craft.js serialize ↔ Forge SiteManifest (per-page).
 * Handles Craft 0.2 flat nodes or { nodes, rootNodeId } shapes.
 */

const CANVAS_TYPES = new Set(['Section', 'Card', 'Flex', 'Grid', 'Form', 'Modal', 'Tabs', 'CraftRoot']);

function parseCraftSerialized(serialized) {
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  if (!raw) return null;
  if (raw.nodes && typeof raw.nodes === 'object') {
    return { nodes: raw.nodes, rootNodeId: raw.rootNodeId || findRootId(raw.nodes) };
  }
  return { nodes: raw, rootNodeId: findRootId(raw) };
}

function findRootId(nodes) {
  if (nodes.ROOT) return 'ROOT';
  for (const [id, n] of Object.entries(nodes)) {
    const name = n?.type?.resolvedName || n?.data?.type?.resolvedName;
    if (name === 'CraftRoot' || name === 'div') return id;
  }
  return Object.keys(nodes)[0];
}

function getNodeData(node) {
  return node.data || node;
}

function resolveTypeName(type) {
  if (!type) return 'Unknown';
  if (typeof type === 'string') return type.replace(/^Craft/, '');
  const name = type.resolvedName || type.name || 'Unknown';
  return String(name).replace(/^Craft/, '');
}

function nodeToComponent(nodeId, nodes) {
  const node = nodes[nodeId];
  if (!node) return null;

  const data = getNodeData(node);
  const { type, props = {}, nodes: childIds = [], linkedNodes = {} } = data;
  const uiType = resolveTypeName(type);

  const comp = {
    type: uiType,
    id: props.id || `${uiType.toLowerCase()}_${nodeId}`,
  };

  const exclude = new Set(['children', 'type']);
  for (const [key, value] of Object.entries(props)) {
    if (exclude.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (key === 'className' && value === '') continue;
    comp[key] = value;
  }

  const childrenIds = [...childIds];
  for (const linkedId of Object.values(linkedNodes)) {
    if (linkedId && !childrenIds.includes(linkedId)) childrenIds.push(linkedId);
  }

  if (childrenIds.length > 0) {
    const children = childrenIds.map(cid => nodeToComponent(cid, nodes)).filter(Boolean);

    if (uiType === 'Tabs' && Array.isArray(props.tabs)) {
      const hasTabChildren = props.tabs.some(t => t.children?.length > 0);
      comp.tabs = props.tabs.map((tab, i) => ({
        label: tab.label || `Tab ${i + 1}`,
        icon: tab.icon,
        children: hasTabChildren ? (tab.children || []) : (i === 0 && children.length ? children : []),
      }));
    } else if (uiType === 'Form') {
      comp.children = children;
      comp.submitLabel = props.submitLabel || 'Submit';
      if (props.submitIcon) comp.submitIcon = props.submitIcon;
    } else if (children.length) {
      comp.children = children;
    }
  }

  if (Object.keys(comp).length <= 2) applyDefaults(comp, uiType);
  return comp;
}

function applyDefaults(comp, type) {
  const d = {
    Button: () => { comp.label = comp.label || 'Button'; },
    Input: () => { comp.placeholder = comp.placeholder || 'Enter text...'; },
    Text: () => { comp.content = comp.content || 'Text'; },
    Badge: () => { comp.label = comp.label || 'Badge'; },
    Card: () => { comp.title = comp.title || 'Card'; },
    Section: () => { comp.title = comp.title || 'Section'; },
    Table: () => { comp.columns = comp.columns || [{ key: 'col1', label: 'Column 1' }]; },
    Modal: () => { comp.triggerLabel = comp.triggerLabel || 'Open'; comp.title = comp.title || 'Modal'; },
    Select: () => { comp.options = comp.options || [{ value: 'a', label: 'Option A' }]; },
    Alert: () => { comp.message = comp.message || 'Alert message'; },
    Form: () => { comp.submitLabel = comp.submitLabel || 'Submit'; },
  };
  d[type]?.();
}

/** Export one page's components from Craft serialized state */
export function exportPageComponents(serialized) {
  const craftState = parseCraftSerialized(serialized);
  if (!craftState?.nodes) return [];

  const { nodes, rootNodeId } = craftState;
  const root = nodes[rootNodeId];
  if (!root) return [];

  const data = getNodeData(root);
  const rootChildIds = data.nodes || [];
  return rootChildIds.map(cid => nodeToComponent(cid, nodes)).filter(Boolean);
}

export function enrichPageMeta(components) {
  const signals = collectSignals(components);
  const sharedState = collectSharedState(components);
  return {
    signals: signals.length ? signals : undefined,
    sharedState: Object.keys(sharedState).length ? sharedState : undefined,
    storage: Object.keys(sharedState).length
      ? { key: `forge-app-${Date.now().toString(36)}` }
      : undefined,
  };
}

function collectSignals(components) {
  const signals = new Set();
  function walk(comps) {
    for (const c of comps || []) {
      if (c.type === 'Button' && c.action?.kind === 'emit' && c.action.signal && !c.action.signal.startsWith('_')) {
        signals.add(c.action.signal);
      }
      if (c.children) walk(c.children);
      if (c.tabs) c.tabs.forEach(t => t.children && walk(t.children));
    }
  }
  walk(components);
  return [...signals];
}

function collectSharedState(components) {
  const state = {};
  function walk(comps) {
    for (const c of comps || []) {
      if (c.type === 'TodoList' && c.dataKey) {
        state[c.dataKey] = 'array';
        if (c.filterKey) state[c.filterKey] = 'string';
      }
      if (c.children) walk(c.children);
      if (c.tabs) c.tabs.forEach(t => t.children && walk(t.children));
    }
  }
  walk(components);
  return state;
}

/** Merge canvas into manifest page at pageIndex */
export function syncManifestPage(manifest, pageIndex, serialized) {
  const m = structuredClone(manifest);
  const page = m.pages[pageIndex];
  if (!page) return m;

  page.components = exportPageComponents(serialized);
  const meta = enrichPageMeta(page.components);
  if (meta.signals) page.signals = meta.signals;
  if (meta.sharedState) page.sharedState = meta.sharedState;
  if (meta.storage && !page.storage) page.storage = meta.storage;

  return m;
}

/** Import one page → Craft deserialize payload */
export function importPageToCraft(page) {
  if (!page?.components) return null;

  const nodes = {};
  let counter = 0;
  const nextId = () => `forge_${counter++}`;

  function createNode(type, props, childIds = []) {
    const id = nextId();
    const isCanvas = CANVAS_TYPES.has(type);
    nodes[id] = {
      type: { resolvedName: type },
      isCanvas,
      props: { ...props },
      nodes: childIds,
      linkedNodes: {},
    };
    return id;
  }

  function convertComponents(comps) {
    return (comps || []).map(c => {
      const { type, children, tabs, ...props } = c;
      let childIds = [];
      if (children?.length) childIds = convertComponents(children);
      if (tabs?.length) {
        tabs.forEach(tab => {
          if (tab.children?.length) childIds.push(...convertComponents(tab.children));
        });
      }
      return createNode(type, props, childIds);
    });
  }

  const childIds = convertComponents(page.components);
  const rootId = 'ROOT';
  nodes[rootId] = {
    type: { resolvedName: 'CraftRoot' },
    isCanvas: true,
    props: { title: page.title || 'Page' },
    nodes: childIds,
    linkedNodes: {},
  };

  return nodes;
}
