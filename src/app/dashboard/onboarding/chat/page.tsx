"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllChatSessions, createChatSession } from "@/lib/aiChatStore";

export default function OnboardingChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const existing = getAllChatSessions();
    if (existing.length > 0) {
      router.replace(
        `/dashboard/onboarding/chat/${encodeURIComponent(existing[0].id)}`
      );
    } else {
      const created = createChatSession();
      router.replace(
        `/dashboard/onboarding/chat/${encodeURIComponent(created.id)}`
      );
    }
  }, [router]);

  return null;
}
