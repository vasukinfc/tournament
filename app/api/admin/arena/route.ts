import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { registrations, results, tickets, tournaments } from "@/db/schema";
import { makeId, routeError, seedArena } from "@/lib/arena-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedArena();
    const db = getDb();
    const [allTournaments, allResults, allRegistrations, allTickets] = await Promise.all([
      db.select().from(tournaments).orderBy(desc(tournaments.startsAt)),
      db.select().from(results).orderBy(asc(results.rank)),
      db.select().from(registrations).orderBy(desc(registrations.createdAt)),
      db.select().from(tickets).orderBy(desc(tickets.createdAt)),
    ]);
    return Response.json({ tournaments: allTournaments, results: allResults, registrations: allRegistrations, tickets: allTickets });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await seedArena();
    const db = getDb();
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "create_tournament") {
      const title = String(body.title ?? "").trim();
      const startsAt = String(body.startsAt ?? "");
      const slots = Number(body.slots ?? 0);
      if (!title || !startsAt || slots < 2) return Response.json({ error: "Title, start time and valid slots are required." }, { status: 400 });
      await db.insert(tournaments).values({ id: makeId("tour"), title, format: String(body.format ?? "Squad"), gameMode: String(body.gameMode ?? "Battle Royale"), map: String(body.map ?? "Bermuda"), startsAt, slots, filled: 0, status: "open" });
      return Response.json({ ok: true, message: "Tournament published." });
    }

    if (action === "publish_room") {
      const tournamentId = String(body.tournamentId ?? "");
      const roomId = String(body.roomId ?? "").trim();
      const roomPassword = String(body.roomPassword ?? "").trim();
      if (!tournamentId || !roomId || !roomPassword) return Response.json({ error: "Tournament, room ID and password are required." }, { status: 400 });
      await db.update(tournaments).set({ roomId, roomPassword, roomReleased: true, status: "live" }).where(eq(tournaments.id, tournamentId));
      return Response.json({ ok: true, message: "Room details released to registered players." });
    }

    if (action === "ticket_reply") {
      const reply = String(body.reply ?? "").trim();
      if (!reply) return Response.json({ error: "Reply cannot be empty." }, { status: 400 });
      await db.update(tickets).set({ adminReply: reply, status: "resolved" }).where(eq(tickets.id, String(body.id ?? "")));
      return Response.json({ ok: true, message: "Reply sent and ticket resolved." });
    }

    if (action === "publish_result") {
      const tournamentId = String(body.tournamentId ?? "");
      const rank = Number(body.rank ?? 0);
      const teamName = String(body.teamName ?? "").trim();
      if (!tournamentId || rank < 1 || !teamName) return Response.json({ error: "Tournament, rank and team are required." }, { status: 400 });
      await db.delete(results).where(and(eq(results.tournamentId, tournamentId), eq(results.rank, rank)));
      await db.insert(results).values({ id: makeId("res"), tournamentId, rank, teamName, kills: Number(body.kills ?? 0), points: Number(body.points ?? 0) });
      return Response.json({ ok: true, message: "Leaderboard updated." });
    }

    return Response.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    const message = routeError(error);
    return Response.json({ error: message }, { status: message === "This record already exists." ? 409 : 500 });
  }
}
