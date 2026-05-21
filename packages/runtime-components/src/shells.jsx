import React from 'react';

/** Default top nav shell */
export function DefaultShell({ children, appName, pages, currentRoute }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#4f46e5' }}>{appName}</span>
        <nav style={{ display: 'flex', gap: 20, fontSize: 14 }}>
          {pages?.map(p => (
            <a key={p.route} href={p.route} style={{ color: p.route === currentRoute ? '#4f46e5' : '#6b7280', fontWeight: p.route === currentRoute ? 600 : 400, textDecoration: 'none' }}>
              {p.title}
            </a>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}

/** Sidebar shell — activated when shell.moduleId === 'core-shell' */
export function SidebarShell({ children, appName, pages, currentRoute }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 240, background: '#1e1b4b', color: '#fff', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', fontWeight: 700, fontSize: 16 }}>{appName}</div>
        <nav>
          {pages?.map(p => (
            <a key={p.route} href={p.route}
              style={{ display: 'block', padding: '10px 20px', color: p.route === currentRoute ? '#fff' : '#a5b4fc', background: p.route === currentRoute ? 'rgba(255,255,255,.1)' : 'transparent', textDecoration: 'none', fontSize: 14 }}>
              {p.title}
            </a>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, background: '#f8fafc', padding: 32, overflow: 'auto' }}>{children}</main>
    </div>
  );
}

export const SHELLS = {
  'core-shell': SidebarShell,
  default: DefaultShell,
};

export function resolveShell(manifest) {
  const id = manifest?.shell?.moduleId || 'default';
  return SHELLS[id] || DefaultShell;
}
