import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Shield, User as UserIcon, Ticket, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { availableUsers, login, loading: authLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await login(selectedUserId);
      showToast('Logged in successfully!', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-md flex flex-col gap-8 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
            <Ticket className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-2 select-none">Support Tracker AI</h1>
          <p className="text-sm text-slate-400">Select a user profile to access the dashboard</p>
        </div>

        {/* Profiles Card */}
        <Card className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">Available Profiles</span>
            <div className="flex flex-col gap-2">
              {Array.isArray(availableUsers) && availableUsers.length > 0 ? (
                availableUsers.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/5'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate">{u.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5 opacity-80">
                            <Shield className="h-3 w-3" />
                            {u.role}
                          </span>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-800'
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-650 text-sm">
                  Connecting to backend server...
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full justify-center"
            disabled={!selectedUserId}
            loading={loading || authLoading}
            onClick={handleLogin}
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};
