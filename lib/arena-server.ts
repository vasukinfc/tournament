import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { results, tournaments } from "@/db/schema";

export const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function currentPlayerEmail() {
  const requestHeaders = await headers();
  return requestHeaders.get("oai-authenticated-user-email") ?? "captain@battlegrid.demo";
}

export async function seedArena() {
  const db = getDb();
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(tournaments);
  if (Number(countRow?.count ?? 0) > 0) return;
  await db.insert(tournaments).values([
    { id: "bg_nightfall", title: "Nightfall Clash", format: "Squad", gameMode: "Battle Royale", map: "Bermuda", startsAt: "2026-09-05T20:00:00+05:30", slots: 12, filled: 9, status: "open" },
    { id: "bg_duo_rush", title: "Duo Rush", format: "Duo", gameMode: "Clash Squad", map: "Kalahari", startsAt: "2026-09-06T18:30:00+05:30", slots: 24, filled: 18, status: "open" },
    { id: "bg_solo_crown", title: "Solo Crown", format: "Solo", gameMode: "Battle Royale", map: "Purgatory", startsAt: "2026-09-07T21:00:00+05:30", slots: 48, filled: 31, status: "open" },
    { id: "bg_weekly_final", title: "Weekly Finals", format: "Squad", gameMode: "Battle Royale", map: "NexTerra", startsAt: "2026-08-30T19:00:00+05:30", slots: 12, filled: 12, status: "completed", roomId: "6839214", roomPassword: "GRID92", roomReleased: true },
  ]);
  await db.insert(results).values([
    { id: "res_1", tournamentId: "bg_weekly_final", rank: 1, teamName: "Vortex Elite", kills: 31, points: 74 },
    { id: "res_2", tournamentId: "bg_weekly_final", rank: 2, teamName: "Shadow Crew", kills: 27, points: 66 },
    { id: "res_3", tournamentId: "bg_weekly_final", rank: 3, teamName: "Rajasthan Reapers", kills: 22, points: 59 },
    { id: "res_4", tournamentId: "bg_weekly_final", rank: 4, teamName: "Nova Kings", kills: 20, points: 51 },
  ]);
}

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) return "Database is being prepared. Please refresh shortly.";
  if (message.includes("UNIQUE")) return "This record already exists.";
  return message;
}
