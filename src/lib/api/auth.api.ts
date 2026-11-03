/**
 * Auth API — typed endpoint functions for /auth/*
 * Used by React Query hooks, NOT called directly from components.
 */
import { apiFetch } from "./client";

// ─── Types (mirrors prima-be auth_schemas.py) ──────────────────────────────

export interface DepartmentDto {
  id: string;
  name: string;
}

/** Mirrors prima-be UserResponse / prima-fe User type */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Procurement Manager" | "Procurement Officer" | "Reviewer" | "Vendor";
  status: "Active" | "Inactive" | "Suspended";
  created_at: string;
  phone?: string;
  department?: DepartmentDto;
  avatar_url?: string;
  last_login?: string;
}

export interface TokenDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserDto;
}

// ─── Request payloads ──────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  department_name?: string;
  role?: string;
  avatar_url?: string;
}

// ─── Endpoint functions ────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/login
   * Returns: access_token, refresh_token, user
   */
  login: (payload: LoginPayload) =>
    apiFetch<TokenDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * POST /auth/register
   * Default role: Procurement Officer
   * Returns: user (no tokens — redirect to /login)
   */
  register: (payload: RegisterPayload) =>
    apiFetch<UserDto>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * GET /auth/me
   * Returns current user from Bearer token
   */
  me: () => apiFetch<UserDto>("/auth/me"),

  /**
   * PUT /auth/me
   * Updates current user's profile
   */
  updateProfile: (payload: UpdateProfilePayload) =>
    apiFetch<UserDto>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /**
   * POST /auth/me/avatar
   * Uploads profile picture for current user
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<UserDto>("/auth/me/avatar", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * POST /auth/refresh  (called internally by client.ts on 401)
   */
  refresh: (refresh_token: string) =>
    apiFetch<TokenDto>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
};
