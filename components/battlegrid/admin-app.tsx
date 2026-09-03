"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle, CalendarClock, FileCheck2,
  Gamepad2, KeyRound, LayoutDashboard, ListChecks, MessageSquareWarning, Plus,
  RefreshCw, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { ArenaShell, LoadingArena, type NavItem } from "@/components/battlegrid/arena-shell";
import type { AdminData, Tournament } from "@/components/battlegrid/types";
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

const panel = "border-white/8 bg-[#12161d] shadow-none";
const muted = "text-white/48";

async function adminApi(action?: Record<string, unknown>) {
  const response = await fetch("/api/admin/arena", action ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action),
  } : { cache: "no-store" });
  const payload = await response.json() as { error?: string; message?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function Heading({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1><p className={`mt-1 text-sm ${muted}`}>{copy}</p></div>{action}</div>;
}

function Empty({ icon: Icon, title, copy }: { icon: typeof Trophy; title: string; copy: string }) {
  return <Card className={panel}><CardContent className="grid min-h-52 place-items-center p-8 text-center"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/5 text-white/45"><Icon /></span><h3 className="font-bold text-white">{title}</h3><p className={`mt-1 max-w-sm text-sm ${muted}`}>{copy}</p></div></CardContent></Card>;
}

export function AdminApp() {
  const [active, setActive] = useState("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/arena", { cache: "no-store" });
      const payload = await response.json() as AdminData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not load admin panel");
      setData(payload);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load admin panel"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Initial client hydration fetch; later refreshes are user-triggered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  if (loading || !data) return <LoadingArena admin />;

  const openTickets = data.tickets.filter((item) => item.status === "open").length;
  const roomPending = data.tournaments.filter((item) => item.status !== "completed" && !item.roomReleased).length;
  const nav: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tournaments", label: "Tournaments", icon: Trophy },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "rooms", label: "Match rooms", icon: KeyRound, badge: roomPending ? String(roomPending) : undefined },
    { id: "results", label: "Results", icon: ListChecks },
    { id: "disputes", label: "Disputes", icon: MessageSquareWarning, badge: openTickets ? String(openTickets) : undefined },
  ];

  return <ArenaShell admin active={active} onSelect={setActive} items={nav}>
    {active === "overview" && <Overview data={data} onNavigate={setActive} />}
    {active === "tournaments" && <TournamentsAdmin data={data} onCreate={() => setCreateOpen(true)} />}
    {active === "registrations" && <Registrations data={data} />}
    {active === "rooms" && <Rooms data={data} onRefresh={load} />}
    {active === "results" && <Results data={data} onRefresh={load} />}
    {active === "disputes" && <Disputes data={data} onRefresh={load} />}
    <CreateTournament open={createOpen} setOpen={setCreateOpen} onRefresh={load} />
  </ArenaShell>;
}

function Overview({ data, onNavigate }: { data: AdminData; onNavigate: (id: string) => void }) {
  const totalSlots = data.tournaments.reduce((sum, item) => sum + item.slots, 0);
  const openTickets = data.tickets.filter((item) => item.status === "open");
  const pendingRooms = data.tournaments.filter((item) => item.status !== "completed" && !item.roomReleased);
  return <>
    <Heading title="Admin overview" copy="Tournament operations, players, rooms, results and disputes." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Trophy} label="Tournaments" value={String(data.tournaments.length)} tone="lime" />
      <Metric icon={Gamepad2} label="Player slots" value={String(totalSlots)} tone="blue" />
      <Metric icon={Users} label="Registrations" value={String(data.registrations.length)} tone="violet" />
      <Metric icon={AlertTriangle} label="Open disputes" value={String(openTickets.length)} tone="orange" />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <Card className={panel}><CardHeader><CardTitle>Operations queue</CardTitle><CardDescription>Items that need organiser action</CardDescription></CardHeader><CardContent className="space-y-3">
        <QueueRow icon={KeyRound} label="Rooms waiting for release" value={pendingRooms.length} onClick={() => onNavigate("rooms")} />
        <QueueRow icon={MessageSquareWarning} label="Disputes waiting for reply" value={openTickets.length} onClick={() => onNavigate("disputes")} />
      </CardContent></Card>
      <Card className={panel}><CardHeader><CardTitle>Recent registrations</CardTitle><CardDescription>Latest players joining events</CardDescription></CardHeader><CardContent className="space-y-3">{data.registrations.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-300"><Users className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{item.playerName}</p><p className={`truncate text-xs ${muted}`}>{item.teamName} · {item.ffUid}</p></div></div>)}{!data.registrations.length && <p className={`py-8 text-center text-sm ${muted}`}>No registrations yet.</p>}</CardContent></Card>
    </div>
  </>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: string; tone: "lime" | "blue" | "violet" | "orange" }) {
  const tones = { lime: "bg-[#d7ff3f]/10 text-[#d7ff3f]", blue: "bg-sky-400/10 text-sky-300", violet: "bg-violet-400/10 text-violet-300", orange: "bg-orange-400/10 text-orange-300" };
  return <Card className={panel}><CardContent className="flex items-center gap-4 p-5"><span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span><div><p className={`text-xs ${muted}`}>{label}</p><p className="text-2xl font-black text-white">{value}</p></div></CardContent></Card>;
}

function QueueRow({ icon: Icon, label, value, onClick }: { icon: typeof Trophy; label: string; value: number; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-4 rounded-xl border border-white/8 bg-white/[.025] p-4 text-left transition hover:bg-white/5"><span className="grid size-10 place-items-center rounded-xl bg-[#d7ff3f]/8 text-[#d7ff3f]"><Icon className="size-4" /></span><span className="flex-1 text-sm font-semibold text-white">{label}</span><Badge className="border-0 bg-white/7 text-white/72">{value}</Badge></button>;
}

function TournamentsAdmin({ data, onCreate }: { data: AdminData; onCreate: () => void }) {
  return <><Heading title="Tournaments" copy="Create and monitor Solo, Duo and Squad competitions." action={<Button onClick={onCreate} className="bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]"><Plus /> New tournament</Button>} />{data.tournaments.length ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{data.tournaments.map((event) => <Card key={event.id} className={`${panel} overflow-hidden`}><div className={`h-1 ${event.status === "completed" ? "bg-white/15" : event.status === "live" ? "bg-orange-400" : "bg-[#d7ff3f]"}`} /><CardHeader><div className="flex items-start justify-between gap-4"><div><Badge variant="outline" className="mb-3 border-white/10 text-white/58">{event.format}</Badge><CardTitle>{event.title}</CardTitle><CardDescription>{event.gameMode} · {event.map}</CardDescription></div><Badge className={`border-0 ${event.status === "open" ? "bg-[#d7ff3f]/12 text-[#d7ff3f]" : event.status === "live" ? "bg-orange-400/12 text-orange-300" : "bg-white/8 text-white/50"}`}>{event.status.toUpperCase()}</Badge></div></CardHeader><CardContent><p className={`flex items-center gap-2 text-sm ${muted}`}><CalendarClock className="size-4" /> {matchTime(event.startsAt)}</p><div className="mt-5 flex justify-between text-xs"><span className={muted}>Filled slots</span><strong className="text-white">{event.filled} / {event.slots}</strong></div><Progress value={(event.filled / event.slots) * 100} className="mt-2 h-2 bg-white/7" /></CardContent></Card>)}</div> : <Empty icon={Trophy} title="No tournaments" copy="Create your first tournament to start registrations." />}</>;
}

function CreateTournament({ open, setOpen, onRefresh }: { open: boolean; setOpen: (open: boolean) => void; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const result = await adminApi({ action: "create_tournament", title: form.get("title"), format: form.get("format"), gameMode: form.get("gameMode"), map: form.get("map"), slots: form.get("slots"), startsAt: form.get("startsAt") });
      toast.success(result.message); setOpen(false); await onRefresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create tournament"); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="border-white/10 bg-[#151a22] text-white"><DialogHeader><DialogTitle>Create tournament</DialogTitle><DialogDescription>Publish a new competition for player registration.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-2"><Label htmlFor="title">Tournament name</Label><Input id="title" name="title" required className="border-white/10 bg-white/5" placeholder="Weekend Clash" /></div><div className="grid gap-4 sm:grid-cols-2"><FieldSelect id="format" label="Format" options={["Solo", "Duo", "Squad"]} /><FieldSelect id="gameMode" label="Game mode" options={["Battle Royale", "Clash Squad"]} /><FieldSelect id="map" label="Map" options={["Bermuda", "Kalahari", "Purgatory", "NexTerra"]} /><div className="grid gap-2"><Label htmlFor="slots">Slots</Label><Input id="slots" name="slots" type="number" min={2} required defaultValue={12} className="border-white/10 bg-white/5" /></div></div><div className="grid gap-2"><Label htmlFor="startsAt">Start date and time</Label><Input id="startsAt" name="startsAt" type="datetime-local" required className="border-white/10 bg-white/5" /></div><DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving} className="bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Publishing…" : "Publish tournament"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function FieldSelect({ id, label, options }: { id: string; label: string; options: string[] }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><select id={id} name={id} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">{options.map((option) => <option key={option} className="bg-[#151a22]">{option}</option>)}</select></div>;
}

function Registrations({ data }: { data: AdminData }) {
  const tournament = (id: string) => data.tournaments.find((item) => item.id === id)?.title ?? "Tournament";
  return <><Heading title="Registrations" copy="Player and team entries across every tournament." />{data.registrations.length ? <Card className={`${panel} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/8 bg-white/[.025] text-xs uppercase tracking-wider text-white/40"><tr><th className="px-5 py-4">Player</th><th className="px-5 py-4">Team</th><th className="px-5 py-4">Free Fire UID</th><th className="px-5 py-4">Tournament</th><th className="px-5 py-4">Contact</th></tr></thead><tbody>{data.registrations.map((item) => <tr key={item.id} className="border-b border-white/6 last:border-0"><td className="px-5 py-4 font-bold text-white">{item.playerName}</td><td className="px-5 py-4 text-white/68">{item.teamName}</td><td className="px-5 py-4 font-mono text-white/60">{item.ffUid}</td><td className="px-5 py-4 text-white/60">{tournament(item.tournamentId)}</td><td className="px-5 py-4 text-white/45">{item.userEmail}</td></tr>)}</tbody></table></div></Card> : <Empty icon={Users} title="No registrations" copy="Registered players will appear here." />}</>;
}

function Rooms({ data, onRefresh }: { data: AdminData; onRefresh: () => Promise<void> }) {
  return <><Heading title="Match rooms" copy="Release room ID and password for registered players." /><div className="space-y-4">{data.tournaments.filter((item) => item.status !== "completed").map((item) => <RoomForm key={item.id} event={item} onRefresh={onRefresh} />)}{!data.tournaments.some((item) => item.status !== "completed") && <Empty icon={KeyRound} title="No active match rooms" copy="Create a tournament before releasing credentials." />}</div></>;
}

function RoomForm({ event, onRefresh }: { event: Tournament; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const submit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault(); const form = new FormData(formEvent.currentTarget); setSaving(true);
    try { const result = await adminApi({ action: "publish_room", tournamentId: event.id, roomId: form.get("roomId"), roomPassword: form.get("roomPassword") }); toast.success(result.message); await onRefresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not release room"); }
    finally { setSaving(false); }
  };
  return <Card className={panel}><CardContent className="p-5 sm:p-6"><form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{event.title}</h3><Badge variant="outline" className="border-white/10 text-white/55">{event.format}</Badge>{event.roomReleased && <Badge className="border-0 bg-emerald-400/12 text-emerald-300">RELEASED</Badge>}</div><p className={`mt-1 text-xs ${muted}`}>{matchTime(event.startsAt)} · {event.map}</p></div><div className="grid gap-2"><Label htmlFor={`room-${event.id}`}>Room ID</Label><Input id={`room-${event.id}`} name="roomId" required defaultValue={event.roomId ?? ""} className="border-white/10 bg-white/5 font-mono" /></div><div className="grid gap-2"><Label htmlFor={`pass-${event.id}`}>Password</Label><Input id={`pass-${event.id}`} name="roomPassword" required defaultValue={event.roomPassword ?? ""} className="border-white/10 bg-white/5 font-mono" /></div><Button disabled={saving} className="bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Releasing…" : event.roomReleased ? "Update room" : "Release room"}</Button></form></CardContent></Card>;
}

function Results({ data, onRefresh }: { data: AdminData; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const tournament = (id: string) => data.tournaments.find((item) => item.id === id)?.title ?? "Tournament";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const target = event.currentTarget; const form = new FormData(target); setSaving(true);
    try { const result = await adminApi({ action: "publish_result", tournamentId: form.get("tournamentId"), rank: form.get("rank"), teamName: form.get("teamName"), kills: form.get("kills"), points: form.get("points") }); toast.success(result.message); target.reset(); await onRefresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not publish result"); }
    finally { setSaving(false); }
  };
  return <><Heading title="Match results" copy="Publish rank, kills and points to the player leaderboard." /><div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]"><Card className={panel}><CardHeader><CardTitle>Publish result</CardTitle><CardDescription>An existing rank for the same tournament will be replaced.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="grid gap-2"><Label htmlFor="resultTournament">Tournament</Label><select id="resultTournament" name="tournamentId" required className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">{data.tournaments.map((item) => <option key={item.id} value={item.id} className="bg-[#151a22]">{item.title}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><NumberField id="rank" label="Rank" min={1} /><NumberField id="kills" label="Kills" min={0} /><NumberField id="points" label="Points" min={0} /></div><div className="grid gap-2"><Label htmlFor="teamName">Team / player</Label><Input id="teamName" name="teamName" required className="border-white/10 bg-white/5" /></div><Button disabled={saving || !data.tournaments.length} className="w-full bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Publishing…" : "Publish result"}</Button></form></CardContent></Card><div>{data.results.length ? <Card className={`${panel} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/8 bg-white/[.025] text-xs uppercase tracking-wider text-white/40"><tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Team</th><th className="px-5 py-4">Tournament</th><th className="px-5 py-4 text-right">Kills</th><th className="px-5 py-4 text-right">Points</th></tr></thead><tbody>{data.results.map((item) => <tr key={item.id} className="border-b border-white/6 last:border-0"><td className="px-5 py-4 font-black text-[#d7ff3f]">#{item.rank}</td><td className="px-5 py-4 font-bold text-white">{item.teamName}</td><td className="px-5 py-4 text-white/50">{tournament(item.tournamentId)}</td><td className="px-5 py-4 text-right text-white/68">{item.kills}</td><td className="px-5 py-4 text-right font-bold text-white">{item.points}</td></tr>)}</tbody></table></div></Card> : <Empty icon={FileCheck2} title="No results" copy="Published leaderboard rows will appear here." />}</div></div></>;
}

function NumberField({ id, label, min }: { id: string; label: string; min: number }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} type="number" min={min} required defaultValue={min} className="border-white/10 bg-white/5" /></div>;
}

function Disputes({ data, onRefresh }: { data: AdminData; onRefresh: () => Promise<void> }) {
  return <><Heading title="Support & disputes" copy="Review player reports and send a resolution." action={<Button variant="outline" onClick={() => void onRefresh()} className="border-white/10 bg-white/4"><RefreshCw /> Refresh</Button>} /><div className="space-y-4">{data.tickets.map((ticket) => <TicketReply key={ticket.id} ticket={ticket} onRefresh={onRefresh} />)}{!data.tickets.length && <Empty icon={MessageSquareWarning} title="No disputes" copy="Player support tickets will appear here." />}</div></>;
}

function TicketReply({ ticket, onRefresh }: { ticket: AdminData["tickets"][number]; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true);
    try { const result = await adminApi({ action: "ticket_reply", id: ticket.id, reply: form.get("reply") }); toast.success(result.message); await onRefresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not send reply"); }
    finally { setSaving(false); }
  };
  return <Card className={panel}><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-white/10 text-white/58">{ticket.category}</Badge><Badge className={`border-0 ${ticket.status === "resolved" ? "bg-emerald-400/12 text-emerald-300" : "bg-amber-400/12 text-amber-300"}`}>{ticket.status.toUpperCase()}</Badge></div><h3 className="mt-3 font-bold text-white">{ticket.subject}</h3><p className={`mt-1 text-sm ${muted}`}>{ticket.message}</p><p className="mt-3 text-xs text-white/35">{ticket.userEmail}</p></div><form onSubmit={submit} className="w-full space-y-3 lg:max-w-md"><Textarea name="reply" required minLength={2} defaultValue={ticket.adminReply ?? ""} placeholder="Write organiser response…" className="min-h-24 border-white/10 bg-white/5" /><Button disabled={saving} className="w-full bg-[#d7ff3f] text-[#11150a] hover:bg-[#c7ef2f]">{saving ? "Sending…" : ticket.status === "resolved" ? "Update reply" : "Resolve & reply"}</Button></form></div></CardContent></Card>;
}
