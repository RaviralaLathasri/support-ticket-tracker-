import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className,
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full animate-fade-in">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={twMerge(
          'w-full px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none',
          error && 'border-rose-500 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-950/10',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
