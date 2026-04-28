import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { DEFAULT_SOLANA_NETWORK } from "@/types/token";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getExplorerLink(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${DEFAULT_SOLANA_NETWORK}`;
}
