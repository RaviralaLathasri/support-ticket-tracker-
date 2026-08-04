import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigate?: (page: 'dashboard' | 'create-ticket') => void;
  activePage?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onNavigate,
  activePage
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        activePage={activePage}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
