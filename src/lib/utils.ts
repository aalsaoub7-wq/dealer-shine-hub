import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && 
         !!(window as any).Capacitor?.isNativePlatform?.();
}
