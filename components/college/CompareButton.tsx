"use client";

import { GitCompare } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useCompareStore } from "@/lib/compare-store";

export function CompareButton({ collegeId }: { collegeId: string }) {
  const { ids, toggle } = useCompareStore();
  const active = ids.includes(collegeId);
  return (
    <Button
      variant={active ? "secondary" : "outline"}
      onClick={() => {
        toggle(collegeId);
        toast.success(active ? "Removed from compare" : "Added to compare");
      }}
      className="w-full"
    >
      <GitCompare className="h-4 w-4" />
      {active ? "Comparing" : "Compare"}
    </Button>
  );
}
