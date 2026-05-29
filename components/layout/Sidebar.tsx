import Link from "next/link";
import { Bookmark, GitCompare } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="grid gap-2 rounded-lg border bg-white p-2 sm:p-3 md:grid-cols-2 lg:sticky lg:top-24 lg:block lg:self-start">
      <Link className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-50" href="/dashboard/saved">
        <Bookmark className="h-4 w-4" /> Saved Colleges
      </Link>
      <Link className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-50" href="/dashboard/comparisons">
        <GitCompare className="h-4 w-4" /> Comparisons
      </Link>
    </aside>
  );
}
