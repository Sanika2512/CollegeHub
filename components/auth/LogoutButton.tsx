"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useCompareStore } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const clearCompare = useCompareStore((state) => state.clear);

  async function handleLogout() {
    clearCompare();
    localStorage.removeItem("compareIds");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    sessionStorage.clear();
    toast.success("Logged out successfully");
   await signOut({ callbackUrl: "/auth/login" });
  }

  return (
    <Button variant="outline" onClick={handleLogout} className={cn("hidden sm:inline-flex", className)}>
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
