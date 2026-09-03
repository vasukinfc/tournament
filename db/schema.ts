import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  format: text("format").notNull(),
  gameMode: text("game_mode").notNull(),
  map: text("map").notNull(),
  startsAt: text("starts_at").notNull(),
  slots: integer("slots").notNull(),
  filled: integer("filled").notNull().default(0),
  status: text("status").notNull().default("open"),
  roomId: text("room_id"),
  roomPassword: text("room_password"),
  roomReleased: integer("room_released", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_tournaments_status_starts").on(table.status, table.startsAt)]);

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  userEmail: text("user_email").notNull(),
  playerName: text("player_name").notNull(),
  ffUid: text("ff_uid").notNull(),
  teamName: text("team_name").notNull().default("Solo"),
  teamMembers: text("team_members").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_registration_tournament_user").on(table.tournamentId, table.userEmail),
  index("idx_registrations_user").on(table.userEmail),
  index("idx_registrations_tournament").on(table.tournamentId),
]);

export const results = sqliteTable("results", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  rank: integer("rank").notNull(),
  teamName: text("team_name").notNull(),
  kills: integer("kills").notNull().default(0),
  points: integer("points").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_results_tournament_rank").on(table.tournamentId, table.rank),
  index("idx_results_points").on(table.points),
]);

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  adminReply: text("admin_reply"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_tickets_status").on(table.status)]);
