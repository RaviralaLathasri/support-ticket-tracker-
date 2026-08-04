import React from 'react';
import type { TicketStatus } from '../types';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case 'New':
      // Blue for New
      return <Badge variant="info" className={className}>{status}</Badge>;
    case 'In Progress':
      // Orange for In Progress
      return <Badge variant="warning" className={className}>{status}</Badge>;
    case 'Resolved':
      // Green for Resolved
      return <Badge variant="success" className={className}>{status}</Badge>;
    default:
      return <Badge variant="secondary" className={className}>{status}</Badge>;
  }
};
