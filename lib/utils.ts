import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  // Always return just the time (e.g., "2:34 PM")
  return format(date, "h:mm a");
}

export function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Today
  if (daysDiff === 0) {
    return "Today";
  }
  
  // Yesterday
  if (daysDiff === 1) {
    return "Yesterday";
  }
  
  // This week: show day name
  if (daysDiff > 1 && daysDiff < 7) {
    return format(date, "EEEE");
  }
  
  // Older: show date
  return format(date, "dd/MM/yyyy");
}

export function formatConversationTime(timestamp: number): string {
  const date = new Date(timestamp);
  // Return just the time for conversation list
  return format(date, "h:mm a");
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  // Format as "Month Day, Year" (e.g., "January 15, 2024")
  return format(date, "MMMM d, yyyy");
}
