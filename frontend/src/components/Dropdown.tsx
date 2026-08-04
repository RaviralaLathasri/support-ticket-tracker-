import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(({
  label,
  error,
  options,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full animate-fade-in">
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={twMerge(
            'w-full px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none transition-all cursor-pointer pr-10',
            error && 'border-rose-500 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-950/10',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
      </div>
      {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';
