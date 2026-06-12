import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatRupiah & formatTanggal sudah dipindah ke @/lib/format
// Import dari sana: import { formatRupiah, formatTanggal } from "@/lib/format";
