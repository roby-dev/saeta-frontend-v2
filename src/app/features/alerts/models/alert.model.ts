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

export interface AlertStateSummary {
  id: string;
  name: string;
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
}

export interface AlertFilter {
  stateId?: string;
  typeId?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateRange?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';
}

export interface AlertsResponse {
  ok: boolean;
  alerts: Alert[];
  total: number;
  page?: number;
  limit?: number;
}
