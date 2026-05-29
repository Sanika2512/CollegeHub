"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { reset: () => void }) {
  return <div className="p-8 text-center"><h2 className="font-display text-2xl font-black">Could not load comparison</h2><Button className="mt-4" onClick={reset}>Try again</Button></div>;
}
