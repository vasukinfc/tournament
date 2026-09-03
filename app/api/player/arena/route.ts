import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { registrations, results, tickets, tournaments } from "@/db/schema";
import { currentPlayerEmail, makeId, routeError, seedArena } from "@/lib/arena-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedArena();
    const db = getDb();
    const email = await currentPlayerEmail();
    const [allTournaments, allResults, userRegistrations, userTickets] = await Promise.all([
      db.select().from(tournaments).orderBy(desc(tournaments.startsAt)),
      db.select().from(results).orderBy(asc(results.rank)),
      db.select().from(registrations).where(eq(registrations.userEmail, email)).orderBy(desc(registrations.createdAt)),
      db.select().from(tickets).where(eq(tickets.userEmail, email)).orderBy(desc(tickets.createdAt)),
    ]);
    return Response.json({
      user: { email, displayName: email.split("@")[0].replace(/[._-]/g, " ") },
      tournaments: allTournaments,
      results: allResults,
      registrations: userRegistrations,
      tickets: userTickets,
    });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await seedArena();
    const db = getDb();
    const email = await currentPlayerEmail();
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "register") {
      const tournamentId = String(body.tournamentId ?? "");
      const [event] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
      if (!event || event.status !== "open") return Response.json({ error: "Tournament registration is closed." }, { status: 400 });
      if (event.filled >= event.slots) return Response.json({ error: "All slots are filled." }, { status: 400 });
      const playerName = String(body.playerName ?? "").trim();
      const ffUid = String(body.ffUid ?? "").trim();
      const teamName = String(body.teamName ?? "Solo").trim();
      const teamMembers = String(body.teamMembers ?? "").trim();
      if (!playerName || !/^\d{6,14}$/.test(ffUid)) return Response.json({ error: "Enter player name and a valid 6–14 digit UID." }, { status: 400 });
      const existing = await db.select().from(registrations).where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.userEmail, email)));
      if (existing.length) return Response.json({ error: "You are already registered." }, { status: 409 });
      await db.insert(registrations).values({ id: makeId("reg"), tournamentId, userEmail: email, playerName, ffUid, teamName: event.format === "Solo" ? "Solo" : teamName, teamMembers });
      await db.update(tournaments).set({ filled: event.filled + 1 }).where(eq(tournaments.id, tournamentId));
      return Response.json({ ok: true, message: "Your tournament slot is confirmed." });
    }

    if (action === "ticket") {
      const subject = String(body.subject ?? "").trim();
      const message = String(body.message ?? "").trim();
      const category = String(body.category ?? "Match dispute").trim();
      if (subject.length < 3 || message.length < 10) return Response.json({ error: "Add a clear subject and at least 10 characters of detail." }, { status: 400 });
      await db.insert(tickets).values({ id: makeId("ticket"), userEmail: email, category, subject, message, status: "open" });
      return Response.json({ ok: true, message: "Support ticket created." });
    }

    return Response.json({ error: "Unknown player action." }, { status: 400 });
  } catch (error) {
    const message = routeError(error);
    return Response.json({ error: message }, { status: message === "This record already exists." ? 409 : 500 });
  }
}
