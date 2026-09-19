import type { AlertType } from './type.model.js';
import type { AlertState } from './state.model.js';
import type { User } from './user.model.js';

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

  user?: Partial<User>;
  attendedBy?: Partial<User>;
  type?: Partial<AlertType>;
  state?: Partial<AlertState>;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
