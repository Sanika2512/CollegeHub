import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFees(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L/yr`;
  return `Rs ${new Intl.NumberFormat("en-IN").format(value)}/yr`;
}

export function formatPackage(value: number) {
  return `${value} LPA`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAcceptanceRate(fees: number, rating: number, type: string) {
  const base = type === "government" ? 8 : type === "deemed" ? 28 : 38;
  const feeFactor = Math.min(22, Math.round(fees / 25000));
  const ratingFactor = Math.round((5 - rating) * 8);
  return Math.max(2, Math.min(75, base + feeFactor + ratingFactor));
}

export function parseIds(ids?: string | null) {
  return (ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);
}
