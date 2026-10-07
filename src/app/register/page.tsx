import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage mode="register" />
    </Suspense>
  );
}
