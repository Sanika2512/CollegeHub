import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-4 py-8 sm:py-10">
      <Card className="w-full p-5 sm:p-6">
        <h1 className="font-display text-3xl font-black sm:text-4xl">Login</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">Sign in to manage your saved colleges and comparisons.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-5 text-center text-sm text-slate-600">New here? <Link className="font-semibold text-primary" href="/auth/signup">Create account</Link></p>
      </Card>
    </main>
  );
}
