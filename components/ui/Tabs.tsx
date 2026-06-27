"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.label);
  return (
    <div>
      {/* Sticky only from md+ : on mobile the navbar wraps to two rows (search bar drops below the
          logo), so a fixed top offset here would either overlap content or float in the wrong spot.
          Below md it just scrolls inline with the page, which is simpler and avoids that bug entirely. */}
      <div className="relative mb-6 -mx-1 border-b bg-slate-50/95 md:sticky md:top-16 md:z-20 md:backdrop-blur">
        <div className="flex gap-2 overflow-x-auto px-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActive(tab.label)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition",
                active === tab.label ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* fade hint so it's visually clear there's more to scroll to on mobile */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-slate-50/95 to-transparent md:hidden" />
      </div>
      {tabs.find((tab) => tab.label === active)?.content}
    </div>
  );
}
