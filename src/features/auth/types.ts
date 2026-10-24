export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type AccountRole = 'student' | 'faculty' | 'alumni' | 'warden' | 'superadmin' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  token: string;
  tenantId: string;
  campusName: string;
  hostelite: boolean;
  changePasswordRequired: boolean;
}

export interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginApiData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
  tenantId: string;
  campusName: string;
  hostelite?: boolean;
  changePasswordRequired?: boolean;
}
