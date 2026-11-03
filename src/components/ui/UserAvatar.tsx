"use client";

import { useState, useEffect, useMemo } from "react";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { cn } from "@/lib/utils";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1"
).replace(/\/api\/v1\/?$/, "");

export function resolveAvatarUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${BACKEND_ORIGIN}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${BACKEND_ORIGIN}/${trimmed}`;
  }
  return `${BACKEND_ORIGIN}/uploads/${trimmed.replace(/^\/+/, "")}`;
}

export interface UserAvatarProps {
  name?: string;
  userId?: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-20 w-20",
};

const ICON_SIZES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-11 w-11",
};

export function UserAvatar({
  name,
  userId,
  avatarUrl,
  size = "sm",
  className,
}: UserAvatarProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: users = [] } = useUsers();
  const [imgError, setImgError] = useState(false);

  const effectiveAvatarUrl = useMemo(() => {
    if (avatarUrl) return resolveAvatarUrl(avatarUrl);

    const normalizedName = name?.trim().toLowerCase();

    if (currentUser) {
      const isCurrentById = Boolean(userId && currentUser.id === userId);
      const isCurrentByName = Boolean(
        normalizedName &&
          (currentUser.name?.trim().toLowerCase() === normalizedName ||
            (normalizedName === "administrator" && userId === "USR-ADMIN"))
      );
      if ((isCurrentById || isCurrentByName) && currentUser.avatar_url) {
        return resolveAvatarUrl(currentUser.avatar_url);
      }
    }

    if (users.length > 0) {
      const matched = users.find(
        (u) =>
          (userId && u.id === userId) ||
          (normalizedName && u.name?.trim().toLowerCase() === normalizedName)
      );
      if (matched?.avatarUrl) {
        return resolveAvatarUrl(matched.avatarUrl);
      }
    }

    return null;
  }, [avatarUrl, userId, name, currentUser, users]);

  useEffect(() => {
    setImgError(false);
  }, [effectiveAvatarUrl]);

  return (
    <span
      suppressHydrationWarning
      title={name || "Pengguna"}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 select-none",
        SIZE_CLASSES[size],
        className
      )}
    >
      {effectiveAvatarUrl && !imgError ? (
        <img
          src={effectiveAvatarUrl}
          alt={name || "Foto profil"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Default No-PP Silhouette Avatar */
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={cn("text-slate-400 translate-y-[10%]", ICON_SIZES[size])}
        >
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-8 1.933-8 5.75V22h16v-2.25c0-3.817-4.134-5.75-8-5.75z" />
        </svg>
      )}
    </span>
  );
}

