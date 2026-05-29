"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.label);
  return (
    <div>
      <div className="sticky top-16 z-20 mb-6 flex gap-2 overflow-x-auto border-b bg-slate-50/95 py-2 backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.label)}
            className={cn("rounded-md px-4 py-2 text-sm font-semibold transition", active === tab.label ? "bg-primary text-white" : "text-slate-600 hover:bg-white")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((tab) => tab.label === active)?.content}
    </div>
  );
}
