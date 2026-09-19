export interface AlertType {
  id: string;
  name: string;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TypesResponse {
  types: AlertType[];
  total: number;
}
