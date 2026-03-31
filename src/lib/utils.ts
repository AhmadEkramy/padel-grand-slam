import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHour(h: number): string {
  const normalized = h % 24;
  const hour12 = normalized === 0 ? 12 : (normalized % 12 === 0 ? 12 : normalized % 12);
  const ampm = normalized < 12 ? "AM" : "PM";
  return `${hour12}:00 ${ampm}`;
}
