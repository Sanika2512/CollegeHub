"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html><body><div className="p-10 text-center"><h1 className="font-display text-3xl font-black">Something went wrong</h1><Button className="mt-4" onClick={reset}>Try again</Button></div></body></html>;
}
