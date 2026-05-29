"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters")
});
type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) {
      setLoading(false);
      toast.error("Could not create account");
      return;
    }
    await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    toast.success("Account created");
    router.push("/dashboard/saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Full name" {...register("name")} />
      {formState.errors.name ? <p className="text-sm text-red-600">{formState.errors.name.message}</p> : null}
      <Input placeholder="Email" type="email" {...register("email")} />
      {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
      <Input placeholder="Password" type="password" {...register("password")} />
      {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
      <Button disabled={loading} className="w-full">{loading ? "Creating..." : "Create account"}</Button>
    </form>
  );
}
