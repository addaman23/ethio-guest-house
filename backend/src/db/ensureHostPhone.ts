import { getDb } from "./database";
import { parseRoles, serializeRoles } from "./mappers";
import type { UserRole } from "../types";

const HOST_PHONE = "+251988013094";

/** Keep demo host account on the real host login number. */
export function ensureHostPhone(): void {
  const db = getDb();

  const host = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get("host_1") as { id: string; phone: string; roles: string } | undefined;

  const byPhone = db
    .prepare("SELECT * FROM users WHERE phone = ?")
    .get(HOST_PHONE) as { id: string; roles: string } | undefined;

  if (host && host.phone !== HOST_PHONE && !byPhone) {
    db.prepare(
      `UPDATE users SET phone = ?, host_verified = 1 WHERE id = ?`
    ).run(HOST_PHONE, host.id);
    return;
  }

  const targetId = byPhone?.id ?? (host?.phone === HOST_PHONE ? host.id : null);
  if (!targetId) return;

  const row = db
    .prepare("SELECT roles FROM users WHERE id = ?")
    .get(targetId) as { roles: string };
  const roles = new Set<UserRole>(parseRoles(row.roles));
  roles.add("guest");
  roles.add("host");
  db.prepare(
    `UPDATE users SET roles = ?, host_verified = 1 WHERE id = ?`
  ).run(serializeRoles([...roles]), targetId);
}
