import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full p-6">
        <h1 className="font-display text-3xl font-black">Create account</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">Save colleges and keep comparison lists in sync.</p>
        <SignupForm />
        <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-primary" href="/auth/login">Login</Link></p>
      </Card>
    </main>
  );
}
