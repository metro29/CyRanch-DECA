import { LoginForm } from "@/app/login/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full animate-pulse rounded-2xl bg-white p-8 shadow-lg h-96" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
