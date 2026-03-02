export interface User {
  id: string;
  email: string;
  username: string;
  level: number;
  xp: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface ApiError {
  code: string;
  message: string;
}
