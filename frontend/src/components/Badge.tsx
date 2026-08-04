import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'secondary',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border';
  
  const variants = {
    primary: 'bg-indigo-950/40 text-indigo-400 border-indigo-850/60',
    secondary: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    success: 'bg-emerald-950/40 text-emerald-400 border-emerald-850/60',
    warning: 'bg-amber-950/40 text-amber-400 border-amber-850/60',
    danger: 'bg-rose-950/40 text-rose-400 border-rose-850/60',
    info: 'bg-sky-950/40 text-sky-400 border-sky-850/60'
  };

  return (
    <span
      className={twMerge(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
