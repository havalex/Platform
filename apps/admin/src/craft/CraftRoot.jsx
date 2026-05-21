import React from 'react';
import { useNode } from '@craftjs/core';

/** Canvas root — holds page-level components */
export function CraftRoot({ title = 'Page', children }) {
  const { connectors: { connect } } = useNode();
  return (
    <div ref={connect} style={{ minHeight: 320, padding: 8 }}>
      {children}
    </div>
  );
}

CraftRoot.craft = {
  displayName: 'CraftRoot',
  props: { title: 'Page' },
  rules: { canDrag: () => false, canMoveIn: () => true },
};
