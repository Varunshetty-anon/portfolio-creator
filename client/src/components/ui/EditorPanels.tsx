import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-6 w-full ${className}`}>
    {children}
  </div>
);

export const PanelSection = ({ 
  title, 
  description, 
  children,
  headerAction
}: { 
  title?: string; 
  description?: string; 
  children: ReactNode;
  headerAction?: ReactNode;
}) => (
  <section className="flex flex-col gap-4 py-6">
    {(title || description || headerAction) && (
      <header className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
        <div className="flex flex-col gap-1">
          {title && <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">{title}</h3>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </header>
    )}
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </section>
);

export const ControlRow = ({ 
  label, 
  control, 
  description 
}: { 
  label: string; 
  control: ReactNode; 
  description?: string; 
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex flex-col flex-1 min-w-0">
      <span className="text-sm font-medium text-text-primary truncate">{label}</span>
      {description && <span className="text-xs text-text-muted truncate">{description}</span>}
    </div>
    <div className="shrink-0 flex items-center justify-end">
      {control}
    </div>
  </div>
);

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon?: React.ElementType; 
  title: string; 
  description: string; 
  action?: ReactNode; 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-raised border border-border/50 rounded-xl">
    {Icon && <Icon className="w-12 h-12 text-text-muted mb-4 stroke-1" />}
    <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
    <p className="text-sm text-text-muted mb-6 max-w-sm">{description}</p>
    {action}
  </div>
);
