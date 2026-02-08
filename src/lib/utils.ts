import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodePlanData(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error("Encoding failed", e);
    return "";
  }
}

export function decodePlanData(encoded: string): any {
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Decoding failed", e);
    return null;
  }
}
