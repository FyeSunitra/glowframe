import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as Thai-locale currency without symbol */
export function money(n: number | string): string {
  return Number(n).toLocaleString('en-US');
}

/** Generate a random booking reference number */
export function genBookingNo(): string {
  return `${Math.floor(100000 + Math.random() * 899999)}-${Math.floor(10 + Math.random() * 89)}`;
}

/** Pick a product placeholder color based on its ID */
const PRODUCT_COLORS = ['#F3C9D2', '#D9E7F2', '#D7ECD9', '#F7E3B7'];
export function productColor(id: number): string {
  return PRODUCT_COLORS[id % PRODUCT_COLORS.length];
}
