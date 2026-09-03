"use client";

import type { LucideIcon } from "lucide-react";
import { Gamepad2, ShieldCheck, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";

export type NavItem = { id: string; label: string; icon: LucideIcon; badge?: string };

export function ArenaShell({ admin = false, active, onSelect, items, children }: {
  admin?: boolean;
  active: string;
  onSelect: (id: string) => void;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r border-white/8 bg-[#090b0f]">
        <SidebarHeader className="border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d7ff3f] text-[#090b0f] shadow-[0_0_28px_rgba(215,255,63,.22)]">
              {admin ? <ShieldCheck className="size-5" /> : <Gamepad2 className="size-5" />}
            </span>
            <span>
              <strong className="block text-[15px] tracking-tight text-white">BattleGrid</strong>
              <span className="text-xs text-white/42">{admin ? "Admin control room" : "Player tournament panel"}</span>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={active === item.id} onClick={() => onSelect(item.id)} className="h-11 rounded-xl px-3 text-white/58 hover:bg-white/6 hover:text-white data-[active=true]:bg-[#d7ff3f]/10 data-[active=true]:text-[#e5ff80]">
                      <item.icon className="size-4.5" />
                      <span>{item.label}</span>
                      {item.badge && <Badge className="ml-auto border-0 bg-[#ff5c35] px-1.5 text-[10px] text-white">{item.badge}</Badge>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#0c0f14]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/8 bg-[#0c0f14]/92 px-4 backdrop-blur-xl sm:px-6">
          <SidebarTrigger className="text-white/72 hover:bg-white/8 hover:text-white" />
          <div className="h-5 w-px bg-white/10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{items.find((item) => item.id === active)?.label}</p>
            <p className="hidden text-xs text-white/38 sm:block">{admin ? "Tournament operations only" : "Compete. Track. Win."}</p>
          </div>
          {!admin && <Badge variant="outline" className="hidden gap-1.5 border-white/10 bg-white/[.035] text-white/58 sm:flex"><Smartphone className="size-3.5" /> Android ready</Badge>}
          <Badge className="border-0 bg-[#d7ff3f] text-[#11150a]">{admin ? "ADMIN" : "PLAYER"}</Badge>
        </header>
        <main className="min-h-[calc(100svh-4rem)] p-4 pb-24 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function LoadingArena({ admin = false }: { admin?: boolean }) {
  return <div className="grid min-h-svh place-items-center bg-[#0c0f14] text-white"><div className="text-center"><div className="mx-auto mb-4 grid size-14 animate-pulse place-items-center rounded-2xl bg-[#d7ff3f] text-[#090b0f]">{admin ? <ShieldCheck /> : <Gamepad2 />}</div><p className="font-semibold">Loading {admin ? "control room" : "arena"}…</p></div></div>;
}
