export type UserRole =
  | 'ADMIN'
  | 'BASE_SEGURIDAD'
  | 'PERSONAL_SEGURIDAD'
  | 'CIUDADANO';

export type AccountStatus = 'HABILITADO' | 'INHABILITADO';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  lastname: string;
  dni: string;
  phone: string;
  email: string;
  role: UserRole;
  image?: string;
  statusAccount?: AccountStatus;
  availability?: string;
  emergencyContacts?: EmergencyContact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  lastname: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  role?: UserRole;
  image?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface UpdateUserPayload {
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  statusAccount?: AccountStatus;
  availability?: string;
  image?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface UserCountsSummary {
  total: number;
  admin: number;
  baseSecurity: number;
  securityPersonnel: number;
  citizen: number;
  enabled: number;
  disabled: number;
}

export interface GetUsersResponse {
  ok: boolean;
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: UserCountsSummary;
}


export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  ok?: boolean;
  message?: string;
}
