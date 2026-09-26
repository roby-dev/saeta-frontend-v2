export interface AlertUserSummary {
  id: string;
  name: string;
  lastname?: string;
  dni?: string;
  phone?: string;
  email?: string;
  image?: string;
  role?: string;
  availability?: string;
  statusAccount?: string;
}

export interface AlertTypeSummary {
  id: string;
  name: string;
  priority?: number;
}

/**
 * Stable, backend-owned state classification. The frontend renders styles and
 * actions from this code, never from the (renameable) state.name string.
 */
export type StateCode = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

/**
 * Actions the backend allows a client to perform on an alert, based on its
 * current state code (see AlertAction policy on the backend). `manage` maps
 * to the generic PUT/PATCH update; `delegate` and `reject` map to their own
 * dedicated endpoints.
 */
export type AlertAction = 'delegate' | 'reject' | 'manage';

export interface AlertStateSummary {
  id: string;
  name: string;
  code?: StateCode;
}

export interface Alert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  typeId: string;
  stateId: string;
  creationDate: string;
  attentionDate?: string;
  culminationDate?: string;
  attendedById?: string;
  commentary?: string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;

  // Populated relations
  user?: AlertUserSummary;
  attendedBy?: AlertUserSummary;
  type?: AlertTypeSummary;
  state?: AlertStateSummary;

  // Actions the current alert.state.code allows a client to take.
  allowedActions?: AlertAction[];
}

export interface AlertFilter {
  stateId?: string;
  typeId?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
  dateRange?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';
}

export interface AlertStateCounts {
  pending: number;
  inProcess: number;
  resolved: number;
  rejected: number;
  total: number;
}

export interface AlertsResponse {
  ok: boolean;
  alerts: Alert[];
  total: number;
  page?: number;
  limit?: number;
  stateCounts?: AlertStateCounts;
}

