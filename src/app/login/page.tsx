import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage mode="login" />
    </Suspense>
  );
}
