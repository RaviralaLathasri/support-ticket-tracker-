import React from 'react';
import { useAuth } from '../context/AuthContext';

import { Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-450 text-slate-400 hover:text-slate-200 transition-colors lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Workspace</h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-full py-1.5 px-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-355 text-slate-300">{user.name}</span>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
