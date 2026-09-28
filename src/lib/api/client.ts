/**
 * Base API client with:
 * - Auto Bearer token injection from localStorage
 * - Automatic token refresh on 401
 * - Typed response envelope
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const json: ApiEnvelope<{ access_token: string; refresh_token: string }> = await res.json();
    localStorage.setItem("access_token", json.data.access_token);
    localStorage.setItem("refresh_token", json.data.refresh_token);
    return json.data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retry = true
): Promise<ApiEnvelope<T>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  // Auto-retry once after refreshing token on 401
  if (res.status === 401 && _retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, options, false);
    // Redirect to login if refresh fails
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Sesi telah berakhir. Silakan login kembali.", 401);
  }

  if (!res.ok) {
    throw new ApiError(
      json.message ?? `HTTP ${res.status}`,
      res.status,
      json.data
    );
  }

  return json as ApiEnvelope<T>;
}
