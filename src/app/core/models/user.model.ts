export type UserRole =
  | 'ADMIN'
  | 'BASE_SEGURIDAD'
  | 'PERSONAL_SEGURIDAD'
  | 'CIUDADANO';

export type AccountStatus = 'ACTIVO' | 'INHABILITADO';

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
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  ok?: boolean;
  message?: string;
}
