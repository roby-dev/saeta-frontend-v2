export interface AlertState {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatesResponse {
  states: AlertState[];
  total: number;
}
