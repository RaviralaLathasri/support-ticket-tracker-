import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Ticket, User } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Dropdown } from '../components/Dropdown';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Loader } from '../components/Loader';
import { Search, Plus, LayoutGrid, CheckCircle2, AlertCircle, Clock, ListTodo } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';

const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  assignedAgentId: z.string().min(1, 'Assigned agent is required'),
});

type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
  });

  // Query tickets
  const { data: tickets = [], isLoading, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets', statusFilter, searchQuery],
    queryFn: async () => {
      const response = await api.get<Ticket[]>('/tickets', {
        params: {
          status_filter: statusFilter || undefined,
          search: searchQuery || undefined,
        },
      });
      return response.data;
    },
    refetchInterval: 5000, // Refresh automatically every 5s
  });

  // Query agents (Manager only)
  const { data: agents = [] } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get<User[]>('/agents');
      return response.data;
    },
    enabled: user?.role === 'Manager',
  });

  // Create ticket mutation (Manager only)
  const createMutation = useMutation({
    mutationFn: async (newTicket: { title: string; description: string; assignedAgentId: number }) => {
      const response = await api.post('/tickets', newTicket);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast('Ticket created and assigned successfully!', 'success');
      setIsCreateOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || 'Failed to create ticket.', 'error');
    },
  });

  const onSubmit = (data: CreateTicketInput) => {
    createMutation.mutate({
      title: data.title,
      description: data.description,
      assignedAgentId: parseInt(data.assignedAgentId),
    });
  };

  // Compute stats
  const totalCount = tickets.length;
  const newCount = tickets.filter((t) => t.status === 'New').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  // Table columns definition based on Role
  const columns = [
    {
      header: 'ID',
      accessor: (t: Ticket) => <span className="text-slate-400 font-mono">#{t.id}</span>,
      className: 'w-16',
    },
    {
      header: 'Title',
      accessor: (t: Ticket) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1">
            {t.title}
          </span>
          <span className="text-xs text-slate-500 line-clamp-1">{t.description}</span>
        </div>
      ),
    },
    ...(user?.role === 'Manager'
      ? [
          {
            header: 'Assigned Agent',
            accessor: (t: Ticket) => (
              <span className="text-sm text-indigo-300 font-medium">
                {t.assignedAgent || 'Unassigned'}
              </span>
            ),
            className: 'hidden sm:table-cell',
          },
        ]
      : []),
    {
      header: 'Created By',
      accessor: (t: Ticket) => <span className="text-sm text-slate-400">{t.createdByName}</span>,
      className: 'hidden md:table-cell',
    },
    {
      header: 'Status',
      accessor: (t: Ticket) => <StatusBadge status={t.status} />,
      className: 'w-28',
    },
    {
      header: 'Date Created',
      accessor: (t: Ticket) => (
        <span className="text-xs text-slate-500">
          {new Date(t.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
      className: 'hidden sm:table-cell w-32',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Upper Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            {user?.role === 'Manager' ? 'Manager Command Center' : 'Agent Workspace'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'Manager'
              ? 'Oversee all customer tickets, assign agents, and manage lifecycle events.'
              : 'Review, progress, and resolve tickets assigned to you.'}
          </p>
        </div>
        {user?.role === 'Manager' && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Card className="flex items-center gap-4 bg-slate-900/40 p-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <h3 className="text-2xl font-bold text-slate-200 mt-1">{totalCount}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-slate-900/40 p-5">
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New</p>
            <h3 className="text-2xl font-bold text-slate-200 mt-1">{newCount}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-slate-900/40 p-5">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-bold text-slate-200 mt-1">{inProgressCount}</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-slate-900/40 p-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-bold text-slate-200 mt-1">{resolvedCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl max-w-fit">
          {[
            { value: '', label: 'All Tickets' },
            { value: 'New', label: 'New' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                statusFilter === tab.value
                  ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
                  : 'text-slate-500 hover:text-slate-350 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search tickets by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-2.5 bg-slate-950/60"
          />
        </div>
      </Card>

      {/* Table Container */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" />
        </div>
      ) : isError ? (
        <Card className="py-12 border-rose-500/20 bg-rose-950/5 text-center text-rose-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
          Failed to load tickets. Please check server connection.
        </Card>
      ) : (
        <Table<Ticket>
          data={tickets}
          columns={columns}
          pageSize={6}
          emptyMessage="No tickets found matching your selection."
          onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
        />
      )}

      {/* Create Ticket Modal (Manager Only) */}
      {user?.role === 'Manager' && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            reset();
          }}
          title="Create New Support Ticket"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <Input
              label="Ticket Title"
              placeholder="e.g. Server constraint memory overflow"
              error={errors.title?.message}
              {...register('title')}
            />
            <Textarea
              label="Description"
              placeholder="Provide a detailed log or description of the customer request..."
              error={errors.description?.message}
              rows={4}
              {...register('description')}
            />
            <Dropdown
              label="Assign Agent"
              error={errors.assignedAgentId?.message}
              options={[
                { value: '', label: '-- Select Support Agent --' },
                ...agents.map((a) => ({ value: a.id, label: a.name })),
              ]}
              {...register('assignedAgentId')}
            />
            <div className="flex gap-3 justify-end border-t border-slate-800/60 pt-4 mt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateOpen(false);
                  reset();
                }}
                type="button"
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={createMutation.isPending}>
                Create & Assign
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
