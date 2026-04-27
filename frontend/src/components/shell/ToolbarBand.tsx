import React from 'react';
import { ToolbarFile }     from '../toolbar/ToolbarFile';
import { ToolbarOrganize } from '../toolbar/ToolbarOrganize';
import { ToolbarComment }  from '../toolbar/ToolbarComment';
import { ToolbarMacro }    from '../toolbar/ToolbarMacro';
import { ToolbarView }     from '../toolbar/ToolbarView';

function ToolbarDivider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--color-border-tertiary)',
        margin: '0 6px',
        flexShrink: 0,
      }}
    />
  );
}

interface ToolbarGroupProps {
  label:    string;
  children: React.ReactNode;
}

function ToolbarGroup({ label, children }: ToolbarGroupProps) {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            0,
        flexShrink:     0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
        {children}
      </div>
      <span
        style={{
          fontSize:   10,
          color:      'var(--color-text-tertiary)',
          lineHeight: 1,
          marginTop:  0,
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function ToolbarBand() {
  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        height:          40,           // h-10 — NEVER exceed this
        minHeight:       40,
        padding:         '0 8px',
        borderBottom:    '0.5px solid var(--color-border-tertiary)',
        background:      'var(--color-background-primary)',
        overflowX:       'auto',
        overflowY:       'hidden',
        scrollbarWidth:  'none',       // hide scrollbar (Firefox)
        flexShrink:      0,
      }}
      // Hide scrollbar (Chrome/Safari)
      className="toolbar-band-scroll"
    >
      <ToolbarGroup label="File">     <ToolbarFile />     </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Organize"> <ToolbarOrganize /> </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Annotate"> <ToolbarComment /> </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Generate"> <ToolbarMacro /> </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="View">     <ToolbarView />     </ToolbarGroup>
      {/* Agent F inserts ToolbarDivider + ToolbarGroup("Writer") here */}
    </div>
  );
}
