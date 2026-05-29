"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Viewed = { name: string; slug: string };

export function TrackRecentlyViewed({ item }: { item: Viewed }) {
  useEffect(() => {
    const current: Viewed[] = JSON.parse(localStorage.getItem("recentlyViewed") ?? "[]");
    const next = [item, ...current.filter((entry) => entry.slug !== item.slug)].slice(0, 4);
    localStorage.setItem("recentlyViewed", JSON.stringify(next));
  }, [item]);
  return null;
}

export function RecentlyViewed() {
  const [items, setItems] = useState<Viewed[]>([]);
  useEffect(() => setItems(JSON.parse(localStorage.getItem("recentlyViewed") ?? "[]")), []);
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-black">Recently viewed</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item.slug} href={`/colleges/${item.slug}`} className="rounded-lg border bg-white p-4 font-semibold hover:border-primary">
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
