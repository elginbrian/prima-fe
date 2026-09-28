/**
 * Prima API Client
 * Centralizes all fetch calls to prima-be (http://localhost:8001/api/v1)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json as ApiResponse<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface DepartmentDto {
  id: string;
  name: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  phone?: string;
  department?: DepartmentDto;
  avatar_url?: string;
  last_login?: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserDto;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<TokenData>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiFetch<UserDto>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  refresh: (refresh_token: string) =>
    apiFetch<TokenData>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  me: () => apiFetch<UserDto>("/auth/me"),
};

export default apiFetch;
