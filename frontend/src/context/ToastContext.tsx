import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-950 text-white';
          let borderClass = 'border-slate-800';
          let icon = <Info className="h-5 w-5 text-sky-400" />;

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-950/95 text-emerald-100';
            borderClass = 'border-emerald-800/80';
            icon = <CheckCircle className="h-5 w-5 text-emerald-400" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-950/95 text-rose-100';
            borderClass = 'border-rose-800/80';
            icon = <AlertCircle className="h-5 w-5 text-rose-400" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center justify-between p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-auto animate-slide-in ${bgClass} ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <p className="text-sm font-medium leading-tight">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors flex-shrink-0 ml-4"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
