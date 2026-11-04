import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateMeetingCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part1}-${part2}-${part3}`;
}

export function extractMeetingCode(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const meetingIdx = pathParts.indexOf('meeting');
    if (meetingIdx !== -1 && pathParts[meetingIdx + 1]) {
      return pathParts[meetingIdx + 1].toLowerCase();
    }
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1].toLowerCase();
    }
  } catch (e) {
    // Not a valid URL, fallback to normal slash splitting
  }

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').filter(Boolean);
    const meetingIdx = parts.indexOf('meeting');
    if (meetingIdx !== -1 && parts[meetingIdx + 1]) {
      return parts[meetingIdx + 1].toLowerCase();
    }
    return parts[parts.length - 1].toLowerCase();
  }

  return trimmed.toLowerCase();
}
