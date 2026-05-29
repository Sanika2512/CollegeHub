"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  if (status === "loading") return <div className="h-32 rounded-lg bg-slate-100" />;
  if (status === "unauthenticated") {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-display text-2xl font-black">Login required</h2>
        <p className="mt-2 text-slate-600">Create an account to manage saved colleges and comparisons.</p>
        <Link href="/auth/login" className="mt-5 inline-flex">
          <Button>Go to login</Button>
        </Link>
      </Card>
    );
  }
  return <>{children}</>;
}
