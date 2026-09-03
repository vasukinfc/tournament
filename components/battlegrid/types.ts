export type Tournament = {
  id: string;
  title: string;
  format: "Solo" | "Duo" | "Squad";
  gameMode: string;
  map: string;
  startsAt: string;
  slots: number;
  filled: number;
  status: string;
  roomId: string | null;
  roomPassword: string | null;
  roomReleased: boolean;
};

export type Registration = {
  id: string;
  tournamentId: string;
  userEmail: string;
  playerName: string;
  ffUid: string;
  teamName: string;
  teamMembers: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  userEmail: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
};

export type Result = {
  id: string;
  tournamentId: string;
  rank: number;
  teamName: string;
  kills: number;
  points: number;
};

export type PlayerData = {
  user: { email: string; displayName: string };
  tournaments: Tournament[];
  results: Result[];
  registrations: Registration[];
  tickets: Ticket[];
};

export type AdminData = {
  tournaments: Tournament[];
  results: Result[];
  registrations: Registration[];
  tickets: Ticket[];
};

export const matchTime = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
}).format(new Date(value));
