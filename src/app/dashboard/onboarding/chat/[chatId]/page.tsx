import { use } from "react";
import AiChatWorkspace from "@/components/pages/onboarding/chat/AiChatWorkspace";

export default function OnboardingChatSessionPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  return <AiChatWorkspace chatId={decodeURIComponent(chatId)} />;
}
