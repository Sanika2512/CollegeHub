"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const publicLinks: NavItem[] = [
  { href: "/colleges", label: "Colleges" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
  { href: "/discussions", label: "Q&A" }
];

export function NavbarClient({
  isSignedIn,
  isAdmin
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? [{ href: "/admin/dashboard", label: "Admin dashboard" }] : publicLinks;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-display text-xl font-black text-primary sm:text-2xl">
          <GraduationCap className="h-7 w-7 shrink-0" />
          <span className="truncate">CollegeHub</span>
        </Link>

        <form action="/colleges" className="relative order-3 w-full md:order-none md:flex-1 lg:max-w-3xl">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input name="q" placeholder="Search colleges, cities, states" className="pl-10" />
        </form>

        <nav className="ml-auto hidden items-center gap-2 text-sm font-semibold lg:flex">
          {!isAdmin
            ? links.map((item) => (
                <Link
                  key={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100",
                    pathname === item.href && "bg-slate-100 text-primary"
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))
            : null}
          {isSignedIn ? (
            <>
              <Link href={isAdmin ? "/admin/dashboard" : "/dashboard/saved"}>
                <Button variant="outline">Dashboard</Button>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/auth/login">
              <Button>Login</Button>
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white text-slate-700 lg:hidden"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100",
                  pathname === item.href && "bg-slate-100 text-primary"
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t pt-3 sm:grid-cols-2">
              {isSignedIn ? (
                <>
                  <Link href={isAdmin ? "/admin/dashboard" : "/dashboard/saved"}>
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <LogoutButton className="flex w-full" />
                </>
              ) : (
                <Link href="/auth/login">
                  <Button className="w-full">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
