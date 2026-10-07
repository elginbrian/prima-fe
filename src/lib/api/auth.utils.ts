/**
 * auth.utils.ts
 *
 * Helpers for managing auth session client-side.
 * Stores tokens in BOTH localStorage (for Axios interceptors)
 * and a cookie (for Next.js Middleware to read on the server/edge).
 */
import type { TokenDto, UserDto } from "./auth.api";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "current_user";

/**
 * Persist login session — called after a successful login or token refresh.
 */
export function setSession(data: TokenDto): void {
  // 1. localStorage — used by Axios interceptors
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  // 2. Cookie — readable by Next.js Edge Middleware
  //    Max-age: 7 days (same as refresh token lifetime)
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${TOKEN_KEY}=${data.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Clear session — called on logout.
 */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);

  // Expire the cookie immediately
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserDto) : null;
  } catch {
    return null;
  }
}
