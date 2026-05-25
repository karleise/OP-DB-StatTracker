import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const COLOR_HEX: Record<string, string> = {
  Red: "#d83a3a",
  Blue: "#3b6fd6",
  Green: "#3aa760",
  Purple: "#8a4fbf",
  Black: "#2d2d2d",
  Yellow: "#e6c43a",
};

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
