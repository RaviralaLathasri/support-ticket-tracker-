import React from 'react';
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
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar onNavigate={onNavigate} activePage={activePage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          <div className="max-w-6xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
