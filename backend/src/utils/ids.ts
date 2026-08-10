import { randomBytes } from "crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(diff));
}
