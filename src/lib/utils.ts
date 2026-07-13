import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, parseISO, formatDistanceToNow } from "date-fns";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate age from birthdate string (ISO format)
 */
export function calculateAge(birthdate: string): number {
  return differenceInYears(new Date(), parseISO(birthdate));
}

/**
 * Format a resident's full name
 */
export function formatFullName(
  firstName: string,
  middleName: string | null,
  lastName: string,
  suffix: string | null
): string {
  const parts = [lastName + ",", firstName];
  if (middleName) {
    parts.push(middleName.charAt(0) + ".");
  }
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join(" ");
}

/**
 * Format a date string to a human-readable format
 */
export function formatDate(
  dateStr: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "—";
  const date = parseISO(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Get relative time string (e.g. "2 hours ago")
 */
export function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

/**
 * Format currency in Philippine Peso
 */
export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return "—";
  return new Intl.NumberFormat("en-PH").format(num);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Get initials from a name (for avatar placeholders)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Debounce a function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if a value is empty (null, undefined, empty string, or empty array)
 */
export function isEmpty(
  value: unknown
): value is null | undefined | "" | never[] {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
