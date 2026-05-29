"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SaveButton({ collegeId, initialSaved = false }: { collegeId: string; initialSaved?: boolean }) {
  const { status } = useSession();
  const [saved, setSaved] = useState(initialSaved);

  async function toggle() {
    if (status !== "authenticated") {
      toast.error("Login to save colleges");
      return;
    }
    const previous = saved;
    setSaved(!saved);
    try {
      const response = await fetch(saved ? `/api/saved/${collegeId}` : "/api/saved", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: saved ? undefined : JSON.stringify({ collegeId })
      });
      if (!response.ok) throw new Error("Save failed");
      localStorage.removeItem("collegehub:saved-colleges");
      toast.success(saved ? "Removed from saved" : "College saved");
    } catch {
      setSaved(previous);
      toast.error("Could not update saved college");
    }
  }

  return (
    <Button variant={saved ? "secondary" : "outline"} onClick={toggle} className="w-full">
      <Bookmark className={saved ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
