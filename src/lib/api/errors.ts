import { ApiError } from "./client";

/**
 * Turns any thrown value into a user-facing message.
 * For BE validation errors (422) the offending fields are appended.
 */
export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  if (error instanceof ApiError) {
    const data = error.data as { errors?: Array<{ field: string; message: string }> } | undefined;
    if (error.statusCode === 422 && Array.isArray(data?.errors) && data.errors.length > 0) {
      const detail = data.errors
        .slice(0, 3)
        .map((e) => `${e.field.replace(/^body\./, "")}: ${e.message}`)
        .join("; ");
      return `Data tidak valid — ${detail}`;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
