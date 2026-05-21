import React, { useState } from 'react';

export function PageModal({ open, onClose, onSubmit }) {
  const [route, setRoute] = useState('/new-page');
  const [title, setTitle] = useState('New Page');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const r = route.startsWith('/') ? route : `/${route}`;
    onSubmit({ route: r, title: title.trim() || 'New Page' });
    onClose();
    setRoute('/new-page');
    setTitle('New Page');
  };

  return (
    <div className="forge-modal-backdrop" onClick={onClose}>
      <div className="forge-modal" onClick={e => e.stopPropagation()}>
        <h3>Add page</h3>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input className="forge-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <label>Route</label>
          <input className="forge-input" value={route} onChange={e => setRoute(e.target.value)} placeholder="/about" />
          <div className="forge-modal-actions">
            <button type="button" className="forge-btn forge-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="forge-btn forge-btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
