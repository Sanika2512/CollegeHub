"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getProviders, getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    getProviders().then((providers) => setHasGoogleProvider(Boolean(providers?.google)));
  }, []);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const result = await signIn("credentials", { ...values, redirect: false });
    setLoading(false);
    if (result?.error) return toast.error("Account not found or password is wrong. Create account first.");
    const session = await getSession();
    const fallbackUrl = session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard/saved";
    toast.success("Welcome back");
    router.push(session?.user?.role === "ADMIN" ? fallbackUrl : searchParams?.get("callbackUrl") ?? fallbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Email" type="email" {...register("email")} />
      {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
      <Input placeholder="Password" type="password" {...register("password")} />
      {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
      <Button disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign in"}</Button>
      {hasGoogleProvider ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard/saved" })}>
          Continue with Google
        </Button>
      ) : null}
    </form>
  );
}
