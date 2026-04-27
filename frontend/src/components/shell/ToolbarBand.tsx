import React from 'react';
import { ToolbarFile } from '../toolbar/ToolbarFile';
import { ToolbarOrganize } from '../toolbar/ToolbarOrganize';
import { ToolbarComment } from '../toolbar/ToolbarComment';
import { ToolbarMacro } from '../toolbar/ToolbarMacro';
import { ToolbarView } from '../toolbar/ToolbarView';

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
      className="bg-slate-200 dark:bg-slate-800"
    />
  );
}

interface ToolbarGroupProps {
  label: string;
  children: React.ReactNode;
}

function ToolbarGroup({ label, children }: ToolbarGroupProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
        {children}
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary)',
          lineHeight: 1,
          marginTop: 0,
          userSelect: 'none',
        }}
        className="text-slate-500 dark:text-slate-400"
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
        display: 'flex',
        alignItems: 'center',
        height: 40,
        minHeight: 40,
        padding: '0 8px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        flexShrink: 0,
      }}
      className="toolbar-band-scroll border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
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
    </div>
  );
}
