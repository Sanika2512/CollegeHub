import { ReactNode } from "react";

export function PageLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto min-h-screen w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>;
}
