import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatHour(h: number): string {
  const normalized = h % 24;
  const hour12 = normalized === 0 ? 12 : (normalized % 12 === 0 ? 12 : normalized % 12);
  const ampm = normalized < 12 ? "AM" : "PM";
  return `${hour12}:00 ${ampm}`;
}

export function normalizeDateString(input: unknown): string {
  if (typeof input === "string") {
    const value = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (value.includes("T")) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return formatLocalDate(d);
      }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatLocalDate(parsed);
    }

    return value;
  }

  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return formatLocalDate(input);
  }

  if (input && typeof input === "object" && "toDate" in input && typeof (input as { toDate?: unknown }).toDate === "function") {
    const dateValue = (input as { toDate: () => Date }).toDate();
    if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
      return formatLocalDate(dateValue);
    }
  }

  return "";
}
