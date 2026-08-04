import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Ticket, TicketHistory, AISummary, User, TicketStatus } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Dropdown } from '../components/Dropdown';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Loader } from '../components/Loader';
import { ArrowLeft, Clock, Bot, Sparkles, AlertCircle, Calendar, MessageSquare, Copy, Check } from 'lucide-react';

export const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TicketStatus | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Fetch ticket details
  const { data: ticket, isLoading: isTicketLoading, isError: isTicketError } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const response = await api.get<Ticket>(`/tickets/${id}`);
      return response.data;
    },
  });

  // Fetch ticket history logs
  const { data: history = [], isLoading: isHistoryLoading } = useQuery<TicketHistory[]>({
    queryKey: ['ticketHistory', id],
    queryFn: async () => {
      const response = await api.get<TicketHistory[]>(`/tickets/${id}/history`);
      return response.data;
    },
  });

  // Fetch AI analysis summaries
  const { data: aiAnalysis, isLoading: isAiLoading, isError: isAiError } = useQuery<AISummary>({
    queryKey: ['ticketAI', id],
    queryFn: async () => {
      const response = await api.get<AISummary>(`/tickets/${id}/ai-analysis`);
      return response.data;
    },
    retry: 1,
  });

  // Fetch agents list for assignment (Manager only)
  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get<User[]>('/agents');
      return response.data;
    },
    enabled: user?.role === 'Manager',
  });

  // Status transition mutation
  const statusMutation = useMutation({
    mutationFn: async (payload: { status: TicketStatus; changedBy: number }) => {
      const response = await api.put(`/tickets/${id}/status`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticketHistory', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast(`Status updated to ${targetStatus} successfully!`, 'success');
      setConfirmOpen(false);
      setTargetStatus(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || 'Failed to update status.', 'error');
      setConfirmOpen(false);
      setTargetStatus(null);
    },
  });

  // Ticket assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const response = await api.put(`/tickets/${id}/assign`, { agentId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast('Ticket reassigned successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || 'Failed to reassign ticket.', 'error');
    },
  });

  const handleStatusChangeClick = (status: TicketStatus) => {
    setTargetStatus(status);
    setConfirmOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!targetStatus || !user) return;
    statusMutation.mutate({
      status: targetStatus,
      changedBy: user.id,
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    assignMutation.mutate(parseInt(selectedAgentId));
  };

  const handleCopyReply = () => {
    if (!aiAnalysis?.suggested_reply) return;
    navigator.clipboard.writeText(aiAnalysis.suggested_reply);
    setCopied(true);
    showToast('Suggested reply copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isTicketLoading) {
    return (
      <div className="py-40 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (isTicketError || !ticket) {
    return (
      <Card className="py-12 border-rose-500/20 bg-rose-950/5 text-center text-rose-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
        <h3 className="font-bold text-lg mb-1">Failed to load ticket</h3>
        <p className="text-sm opacity-80 mb-4">You may not have permission to view this ticket or it does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Card>
    );
  }

  // Determine permitted transitions
  const canProgressToInProgress = ticket.status === 'New';
  const canResolve = ticket.status === 'In Progress';
  const canReopen = user?.role === 'Manager' && ticket.status === 'Resolved';

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Top Breadcrumb Nav */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-slate-450 text-slate-400 hover:text-slate-200 transition-colors max-w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Ticket details, action board, status history logs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-6">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-800/60 pb-5">
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-xs font-mono text-slate-500">TICKET ID #{ticket.id}</span>
                <h1 className="text-xl font-bold tracking-tight text-slate-100 break-words leading-tight">
                  {ticket.title}
                </h1>
              </div>
              <StatusBadge status={ticket.status} className="px-3.5 py-1 text-xs" />
            </div>

            {/* Description content */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                Description
              </span>
              <p className="text-slate-300 leading-relaxed text-sm bg-slate-950/20 border border-slate-850 p-4 rounded-xl whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Meta attributes grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-5 text-sm select-none">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-semibold">Assigned Agent</span>
                <span className="font-medium text-slate-350 text-slate-350">{ticket.assignedAgent || 'Unassigned'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-semibold">Created By</span>
                <span className="font-medium text-slate-350">{ticket.createdByName}</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Created Date
                </span>
                <span className="font-medium text-slate-350">
                  {new Date(ticket.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Dashboard Panel */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-widest text-slate-400 select-none">
              Action Board
            </h3>

            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* Lifecycle Progress Buttons */}
              <div className="flex gap-2">
                {canProgressToInProgress && (
                  <Button
                    onClick={() => handleStatusChangeClick('In Progress')}
                    loading={statusMutation.isPending && targetStatus === 'In Progress'}
                  >
                    Start Investigation
                  </Button>
                )}
                {canResolve && (
                  <Button
                    onClick={() => handleStatusChangeClick('Resolved')}
                    loading={statusMutation.isPending && targetStatus === 'Resolved'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10 focus:ring-emerald-500"
                  >
                    Mark as Resolved
                  </Button>
                )}
                {canReopen && (
                  <Button
                    onClick={() => handleStatusChangeClick('In Progress')}
                    loading={statusMutation.isPending && targetStatus === 'In Progress'}
                    variant="outline"
                  >
                    Reopen Ticket
                  </Button>
                )}
                {!canProgressToInProgress && !canResolve && !canReopen && (
                  <span className="text-xs text-slate-500 italic py-2">
                    No status actions available for current role and status context.
                  </span>
                )}
              </div>

              {/* Assignment Form (Manager only) */}
              {user?.role === 'Manager' && (
                <form onSubmit={handleAssignSubmit} className="flex gap-2 items-end max-w-sm w-full md:w-auto">
                  <Dropdown
                    options={[
                      { value: '', label: '-- Select Agent --' },
                      ...agents.map((a) => ({ value: a.id, label: a.name })),
                    ]}
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="py-2.5 max-w-[200px]"
                  />
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={!selectedAgentId || assignMutation.isPending}
                    loading={assignMutation.isPending}
                    className="whitespace-nowrap px-4 py-2.5"
                  >
                    Reassign
                  </Button>
                </form>
              )}
            </div>
          </Card>

          {/* Ticket History Timeline */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-widest text-slate-400 select-none">
              Activity History Log
            </h3>
            {isHistoryLoading ? (
              <Loader size="sm" />
            ) : (
              <div className="flex flex-col gap-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800/80 pl-2 mt-2 select-none">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-4 relative">
                    <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 z-10">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium text-slate-200 leading-normal">
                        <span className="font-bold text-slate-100">{h.changedBy}</span>{' '}
                        {h.oldStatus ? (
                          <>
                            changed status from{' '}
                            <span className="text-slate-400 font-semibold">{h.oldStatus}</span> to{' '}
                            <span className="text-indigo-400 font-semibold">{h.newStatus}</span>
                          </>
                        ) : (
                          <>
                            created the ticket with initial status{' '}
                            <span className="text-indigo-400 font-semibold">{h.newStatus}</span>
                          </>
                        )}
                      </p>
                      <span className="text-xs text-slate-550 text-slate-500">
                        {new Date(h.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: AI Assistant Panel */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <Card className="bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_60%)] border-indigo-500/10 shadow-lg shadow-indigo-500/2">
            {/* Title banner */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-indigo-500/10 mb-4 select-none">
              <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/25 flex-shrink-0 animate-pulse">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-indigo-200 text-sm tracking-wide">AI Ticket Insights</h3>
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 ml-auto" />
            </div>

            {isAiLoading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Loader size="sm" />
                <span className="text-xs text-slate-500">Analyzing ticket contents...</span>
              </div>
            ) : isAiError || !aiAnalysis ? (
              <div className="py-8 text-center text-slate-550 flex flex-col gap-2">
                <AlertCircle className="h-6 w-6 text-slate-600 mx-auto" />
                <span className="text-xs text-slate-500">Failed to analyze using Gemini AI.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-5 text-sm">
                {/* AI Sentiment */}
                <div className="flex justify-between items-center bg-slate-950/20 p-2.5 border border-slate-900 rounded-xl select-none">
                  <span className="text-xs text-slate-500 font-semibold">Customer Sentiment</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                      aiAnalysis.sentiment === 'Frustrated'
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-400'
                        : aiAnalysis.sentiment === 'Happy'
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {aiAnalysis.sentiment}
                  </span>
                </div>

                {/* AI Tags */}
                <div className="flex flex-col gap-1.5 select-none">
                  <span className="text-xs text-slate-500 font-semibold">Suggested Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.suggested_tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg text-slate-400 tracking-wide uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500 font-semibold select-none">Executive Summary</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/10 p-3 rounded-xl border border-slate-900">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {/* Suggested Reply Card */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> Suggested Draft Reply
                    </span>
                    <button
                      onClick={handleCopyReply}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-500/5"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/45 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap select-text font-serif italic text-slate-400">
                    "{aiAnalysis.suggested_reply}"
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog overlay */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setTargetStatus(null);
        }}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to update the status of this ticket from '${ticket.status}' to '${targetStatus}'? This status change will be logged in the activity history timeline.`}
        loading={statusMutation.isPending}
      />
    </div>
  );
};
