import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 select-none">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspace</h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-full py-1.5 px-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-350">{user.name}</span>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
