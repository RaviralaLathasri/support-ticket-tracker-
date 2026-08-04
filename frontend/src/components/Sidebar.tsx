import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Shield, Ticket, User as UserIcon, X } from 'lucide-react';
import { Button } from './Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (page: 'dashboard' | 'create-ticket') => void;
  activePage?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  onNavigate,
  activePage = 'dashboard'
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const sidebarContent = (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col flex-shrink-0 h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-650/10 text-indigo-400 rounded-xl border border-indigo-550/20">
            <Ticket className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight text-sm">Support Tracker AI</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-450 text-slate-400 hover:text-slate-200 transition-colors lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Information Profile Card */}
      <div className="p-6 border-b border-slate-850 bg-slate-950/20 flex gap-3 items-center">
        <div className="p-2 bg-slate-800/80 text-indigo-400 rounded-xl border border-slate-700/60 flex-shrink-0">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-slate-200 truncate">{user.name}</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <Shield className="h-3 w-3 text-indigo-500" />
            {user.role}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
        <button
          onClick={() => {
            onNavigate?.('dashboard');
            onClose?.();
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            activePage === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-850">
        <Button variant="secondary" className="w-full justify-start gap-3" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
          {/* Sidebar drawer */}
          <div className="relative z-10 h-full animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
