"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarClock, ChevronRight, CircleHelp, Crosshair, Gamepad2, LayoutDashboard,
  LockKeyhole, MapPin, Medal, RefreshCw, ShieldCheck, Swords, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { ArenaShell, LoadingArena, type NavItem } from "@/components/battlegrid/arena-shell";
import type { PlayerData, Tournament } from "@/components/battlegrid/types";
import { matchTime } from "@/components/battlegrid/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const nav: NavItem[] = [
  { id: "arena", label: "Arena", icon: LayoutDashboard },
  { id: "tournaments", label: "Tournaments", icon: Swords },
  { id: "matches", label: "My matches", icon: Gamepad2 },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "support", label: "Support & disputes", icon: CircleHelp },
];

const panel = "border-white/8 bg-[#12161d] shadow-none";
const muted = "text-white/48";

async function api(action?: Record<string, unknown>) {
  const response = await fetch("/api/player/arena", action ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action),
  } : { cache: "no-store" });
  const payload = await response.json() as { error?: string; message?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function SectionTitle({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1><p className={`mt-1 text-sm ${muted}`}>{copy}</p></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Trophy; title: string; copy: string }) {
  return <Card className={panel}><CardContent className="grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/5 text-white/45"><Icon /></span><h3 className="font-bold text-white">{title}</h3><p className={`mt-1 max-w-sm text-sm ${muted}`}>{copy}</p></div></CardContent></Card>;
}

export function PlayerApp() {
  const [active, setActive] = useState("arena");
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await fetch("/api/player/arena", { cache: "no-store" });
      const payload = await response.json() as PlayerData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not load arena");
      setData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load arena");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    // Initial client hydration fetch; later refreshes are user-triggered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  if (loading || !data) return <LoadingArena />;

  const openEvents = data.tournaments.filter((item) => item.status === "open");
  const registeredIds = new Set(data.registrations.map((item) => item.tournamentId));
  const myEvents = data.tournaments.filter((item) => registeredIds.has(item.id));
  const results = [...data.results].sort((a, b) => b.points - a.points || a.rank - b.rank);

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const result = await api({
        action: "register", tournamentId: selected.id, playerName: form.get("playerName"),
        ffUid: form.get("ffUid"), teamName: form.get("teamName"), teamMembers: form.get("teamMembers"),
      });
      toast.success(result.message);
      setSelected(null);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Registration failed"); }
    finally { setSaving(false); }
  };

  return <ArenaShell active={active} onSelect={setActive} items={nav}>
    {active === "arena" && <ArenaHome data={data} events={openEvents} myEvents={myEvents} results={results} onView={() => setActive("tournaments")} />}
    {active === "tournaments" && <Tournaments events={openEvents} registeredIds={registeredIds} onRegister={setSelected} />}
    {active === "matches" && <MyMatches events={myEvents} />}
    {active === "leaderboard" && <Leaderboard data={data} results={results} />}
    {active === "support" && <Support data={data} onRefresh={load} />}

    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="border-white/10 bg-[#151a22] text-white">
        <DialogHeader><DialogTitle>Join {selected?.title}</DialogTitle><DialogDescription>Enter your Free Fire player details. Your slot is confirmed immediately.</DialogDescription></DialogHeader>
        <form onSubmit={submitRegistration} className="space-y-4">
          <div className="grid gap-2"><Label htmlFor="playerName">Player name</Label><Input id="playerName" name="playerName" required placeholder="In-game name" className="border-white/10 bg-white/5" /></div>
          <div className="grid gap-2"><Label htmlFor="ffUid">Free Fire UID</Label><Input id="ffUid" name="ffUid" required inputMode="numeric" pattern="[0-9]{6,14}" placeholder="6–14 digit UID" className="border-white/10 bg-white/5" /></div>
          {selected?.format !== "Solo" && <>
            <div className="grid gap-2"><Label htmlFor="teamName">Team name</Label><Input id="teamName" name="teamName" required placeholder="Your team" className="border-white/10 bg-white/5" /></div>
            <div className="grid gap-2"><Label htmlFor="teamMembers">Teammates</Label><Textarea id="teamMembers" name="teamMembers" placeholder="Player names and UIDs, one per line" className="min-h-24 border-white/10 bg-white/5" /></div>
          </>}
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={saving} className="bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Confirming…" : "Confirm slot"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </ArenaShell>;
}

function ArenaHome({ data, events, myEvents, results, onView }: { data: PlayerData; events: Tournament[]; myEvents: Tournament[]; results: PlayerData["results"]; onView: () => void }) {
  const filled = events.reduce((sum, item) => sum + item.filled, 0);
  const top = results[0]?.teamName ?? "Awaiting result";
  return <>
    <SectionTitle title={`Welcome, ${data.user.displayName}`} copy="Everything you need to enter tournaments and play your matches." action={<Button onClick={onView} className="bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">Browse tournaments <ChevronRight /></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={ShieldCheck} label="My registrations" value={String(data.registrations.length)} tone="lime" />
      <Stat icon={Swords} label="Open events" value={String(events.length)} tone="blue" />
      <Stat icon={Users} label="Filled slots" value={String(filled)} tone="orange" />
      <Stat icon={Medal} label="Top squad" value={top} tone="violet" />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Card className={panel}><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Next tournaments</CardTitle><CardDescription>Open registrations</CardDescription></div><Badge className="border-0 bg-[#d7ff3f]/12 text-[#d7ff3f]">LIVE</Badge></CardHeader><CardContent className="space-y-3">{events.slice(0, 3).map((item) => <CompactEvent key={item.id} event={item} />)}{!events.length && <p className={`py-8 text-center text-sm ${muted}`}>No open tournaments yet.</p>}</CardContent></Card>
      <Card className={panel}><CardHeader><CardTitle>Match access</CardTitle><CardDescription>Room credentials appear here after release</CardDescription></CardHeader><CardContent className="space-y-3">{myEvents.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl border border-white/8 bg-white/[.025] p-4"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-white">{item.title}</p><Badge variant="outline" className="border-white/10 text-white/54">{item.format}</Badge></div><p className={`mt-2 text-xs ${muted}`}>{item.roomReleased ? "Room details released" : `Scheduled ${matchTime(item.startsAt)}`}</p></div>)}{!myEvents.length && <p className={`py-8 text-center text-sm ${muted}`}>Join a tournament to see match access.</p>}</CardContent></Card>
    </div>
  </>;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: string; tone: "lime" | "blue" | "orange" | "violet" }) {
  const tones = { lime: "bg-[#d7ff3f]/10 text-[#d7ff3f]", blue: "bg-sky-400/10 text-sky-300", orange: "bg-orange-400/10 text-orange-300", violet: "bg-violet-400/10 text-violet-300" };
  return <Card className={panel}><CardContent className="flex items-center gap-4 p-5"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span><div className="min-w-0"><p className={`text-xs ${muted}`}>{label}</p><p className="truncate text-xl font-black text-white">{value}</p></div></CardContent></Card>;
}

function CompactEvent({ event }: { event: Tournament }) {
  return <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[.025] p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d7ff3f]/10 text-[#d7ff3f]"><Crosshair /></span><div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{event.title}</p><p className={`mt-1 text-xs ${muted}`}>{event.format} · {event.map} · {matchTime(event.startsAt)}</p></div><span className="text-right"><strong className="block text-sm text-white">{event.filled}/{event.slots}</strong><span className={`text-[11px] ${muted}`}>slots</span></span></div>;
}

function Tournaments({ events, registeredIds, onRegister }: { events: Tournament[]; registeredIds: Set<string>; onRegister: (event: Tournament) => void }) {
  return <><SectionTitle title="Open tournaments" copy="Choose Solo, Duo or Squad and reserve your player slot." />{events.length ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{events.map((event) => {
    const registered = registeredIds.has(event.id);
    const full = event.filled >= event.slots;
    return <Card key={event.id} className={`${panel} overflow-hidden`}><div className="h-1 bg-gradient-to-r from-[#d7ff3f] via-sky-400 to-transparent" /><CardHeader><div className="flex items-start justify-between gap-3"><div><Badge className="mb-3 border-0 bg-white/7 text-white/68">{event.format}</Badge><CardTitle className="text-xl">{event.title}</CardTitle><CardDescription>{event.gameMode}</CardDescription></div><span className="grid size-11 place-items-center rounded-xl bg-[#d7ff3f]/10 text-[#d7ff3f]"><Swords /></span></div></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 text-sm"><Detail icon={MapPin} label="Map" value={event.map} /><Detail icon={CalendarClock} label="Starts" value={matchTime(event.startsAt)} /></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs"><span className={muted}>Player slots</span><span className="font-semibold text-white">{event.filled} / {event.slots}</span></div><Progress value={(event.filled / event.slots) * 100} className="h-2 bg-white/7" /></div><Button className="mt-5 w-full bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]" disabled={registered || full} onClick={() => onRegister(event)}>{registered ? "Already registered" : full ? "Slots full" : "Join tournament"}</Button></CardContent></Card>;
  })}</div> : <EmptyState icon={Swords} title="No open tournaments" copy="New tournaments will appear here as soon as the organiser publishes them." />}</>;
}

function Detail({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return <div className="rounded-xl bg-white/[.035] p-3"><Icon className="mb-2 size-4 text-[#d7ff3f]" /><p className={`text-[11px] ${muted}`}>{label}</p><p className="mt-0.5 font-semibold text-white">{value}</p></div>;
}

function MyMatches({ events }: { events: Tournament[] }) {
  return <><SectionTitle title="My matches" copy="Your registrations, schedule and released room credentials." />{events.length ? <div className="space-y-4">{events.map((event) => <Card key={event.id} className={panel}><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-white">{event.title}</h3><Badge variant="outline" className="border-white/10 text-white/58">{event.format}</Badge><Badge className={`border-0 ${event.roomReleased ? "bg-emerald-400/12 text-emerald-300" : "bg-amber-400/12 text-amber-300"}`}>{event.roomReleased ? "ROOM LIVE" : "SCHEDULED"}</Badge></div><p className={`mt-2 text-sm ${muted}`}>{event.gameMode} · {event.map} · {matchTime(event.startsAt)}</p></div>{event.roomReleased ? <div className="grid gap-3 sm:grid-cols-2"><RoomSecret label="Room ID" value={event.roomId || "—"} /><RoomSecret label="Password" value={event.roomPassword || "—"} /></div> : <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] px-4 py-3 text-sm text-white/55"><LockKeyhole className="size-4" /> Credentials release by admin</div>}</div></CardContent></Card>)}</div> : <EmptyState icon={Gamepad2} title="No matches yet" copy="Register for a tournament and it will appear here with its room details." />}</>;
}

function RoomSecret({ label, value }: { label: string; value: string }) {
  return <div className="min-w-36 rounded-xl border border-[#d7ff3f]/18 bg-[#d7ff3f]/6 px-4 py-3"><p className="text-[11px] text-[#d7ff3f]/65">{label}</p><p className="mt-1 font-mono text-lg font-bold tracking-wider text-[#e8ff91]">{value}</p></div>;
}

function Leaderboard({ data, results }: { data: PlayerData; results: PlayerData["results"] }) {
  const tournamentName = (id: string) => data.tournaments.find((item) => item.id === id)?.title ?? "Tournament";
  return <><SectionTitle title="Leaderboard" copy="Published match rankings based on kills and total points." />{results.length ? <Card className={`${panel} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/8 bg-white/[.025] text-xs uppercase tracking-wider text-white/40"><tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Team</th><th className="px-5 py-4">Tournament</th><th className="px-5 py-4 text-right">Kills</th><th className="px-5 py-4 text-right">Points</th></tr></thead><tbody>{results.map((result, index) => <tr key={result.id} className="border-b border-white/6 last:border-0"><td className="px-5 py-4"><span className={`grid size-8 place-items-center rounded-lg font-black ${index === 0 ? "bg-[#d7ff3f] text-[#11150a]" : "bg-white/6 text-white/70"}`}>{index + 1}</span></td><td className="px-5 py-4 font-bold text-white">{result.teamName}</td><td className="px-5 py-4 text-white/50">{tournamentName(result.tournamentId)}</td><td className="px-5 py-4 text-right text-white/68">{result.kills}</td><td className="px-5 py-4 text-right font-black text-[#d7ff3f]">{result.points}</td></tr>)}</tbody></table></div></Card> : <EmptyState icon={Trophy} title="No results published" copy="Official leaderboard results will appear after the organiser publishes a match result." />}</>;
}

function Support({ data, onRefresh }: { data: PlayerData; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const tickets = useMemo(() => [...data.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.tickets]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    setSaving(true);
    try { const result = await api({ action: "ticket", category: form.get("category"), subject: form.get("subject"), message: form.get("message") }); toast.success(result.message); target.reset(); await onRefresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not send ticket"); }
    finally { setSaving(false); }
  };
  return <><SectionTitle title="Support & disputes" copy="Report match, player conduct or technical issues to the organiser." action={<Button variant="outline" onClick={() => void onRefresh()} className="border-white/10 bg-white/4"><RefreshCw /> Refresh</Button>} /><div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><Card className={panel}><CardHeader><CardTitle>Create a ticket</CardTitle><CardDescription>Include enough detail for a quick review.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="grid gap-2"><Label htmlFor="category">Category</Label><select id="category" name="category" className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option className="bg-[#151a22]">Match dispute</option><option className="bg-[#151a22]">Player conduct</option><option className="bg-[#151a22]">Technical</option></select></div><div className="grid gap-2"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required minLength={3} className="border-white/10 bg-white/5" placeholder="What happened?" /></div><div className="grid gap-2"><Label htmlFor="message">Details</Label><Textarea id="message" name="message" required minLength={10} className="min-h-32 border-white/10 bg-white/5" placeholder="Match name, time and full details…" /></div><Button disabled={saving} className="w-full bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Sending…" : "Submit ticket"}</Button></form></CardContent></Card><div className="space-y-3">{tickets.map((ticket) => <Card key={ticket.id} className={panel}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><Badge variant="outline" className="mb-3 border-white/10 text-white/58">{ticket.category}</Badge><h3 className="font-bold text-white">{ticket.subject}</h3></div><Badge className={`border-0 ${ticket.status === "resolved" ? "bg-emerald-400/12 text-emerald-300" : "bg-amber-400/12 text-amber-300"}`}>{ticket.status.toUpperCase()}</Badge></div><p className={`mt-2 text-sm ${muted}`}>{ticket.message}</p>{ticket.adminReply && <div className="mt-4 rounded-xl border border-[#d7ff3f]/15 bg-[#d7ff3f]/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#d7ff3f]">Admin reply</p><p className="mt-1 text-sm text-white/72">{ticket.adminReply}</p></div>}</CardContent></Card>)}{!tickets.length && <EmptyState icon={CircleHelp} title="No support tickets" copy="Your support requests and organiser replies will appear here." />}</div></div></>;
}
