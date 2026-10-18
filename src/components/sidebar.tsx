"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Images, PanelLeft, Settings, StickyNote, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { NAV } from "@/lib/nav";
import { daysUntil } from "@/lib/dates";

const FOLDED_KEY = "sidebar-folded";

/**
 * The left-hand column on laptops (canvas 3 "Laptop · Round 1 · The frame",
 * A folding into C, owner's pick 18 Oct 2026): whose wedding, the five tabs,
 * Your notes and Inspo, Ask your assistant, Settings. One tap folds it to a
 * slim rail of icons with their words, leaving more room for the page; the
 * choice is kept on that computer.
 */
export default function Sidebar({
  name,
  weddingDate,
  inboxCount,
}: {
  name: string;
  weddingDate: string | null;
  inboxCount: number;
}) {
  const pathname = usePathname();
  const days = weddingDate ? daysUntil(weddingDate) : null;
  const daysText = days === null ? "No date yet" : days > 0 ? `${days} days to go` : days === 0 ? "Today" : "Married";
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    try {
      setFolded(localStorage.getItem(FOLDED_KEY) === "1");
    } catch {}
  }, []);
  const toggle = () => {
    setFolded((was) => {
      try {
        localStorage.setItem(FOLDED_KEY, was ? "0" : "1");
      } catch {}
      return !was;
    });
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const extras: { label: string; short: string; icon: LucideIcon; href: string; count?: number }[] = [
    { label: "Your notes", short: "Notes", icon: StickyNote, href: "/inbox", count: inboxCount },
    { label: "Inspo", short: "Inspo", icon: Images, href: "/inspo" },
  ];

  if (folded) {
    return (
      <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center border-r-[0.5px] border-ink/[0.12] bg-white/35 px-2.5 py-5 print:!hidden lg:flex">
        <button
          type="button"
          onClick={toggle}
          aria-label="Open the menu"
          title="Open the menu"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] text-stone hover:bg-white/60 hover:text-ink"
        >
          <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
        <div className="mt-1.5 flex flex-col items-center gap-1 pb-4" title={name}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-champagne-400 font-display text-[15px] text-champagne-600">
            {initialsOf(name)}
          </span>
          <span className="text-[12px] text-champagne-600">{days !== null && days > 0 ? `${days} days` : daysText}</span>
        </div>

        <nav aria-label="Main" className="glass-card flex flex-col gap-1 rounded-[28px] p-1.5">
          {NAV.map((item) =>
            item.href ? (
              <RailLink key={item.label} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} />
            ) : null,
          )}
        </nav>
        <div className="mt-3.5 flex flex-col gap-1">
          {extras.map((item) => (
            <RailLink key={item.href} href={item.href} icon={item.icon} label={item.short} active={isActive(item.href)} count={item.count} />
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2.5">
          <AssistantSheet variant="rail" />
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              pathname === "/settings" ? "bg-white text-ink" : "text-stone hover:bg-white/60 hover:text-ink"
            }`}
          >
            <Settings className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r-[0.5px] border-ink/[0.12] bg-white/35 px-4 pb-6 pt-8 print:!hidden lg:flex">
      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="min-w-0">
          <p className="font-display text-[28px] font-light leading-[1.1] tracking-[-0.01em] text-ink">{name}</p>
          <p className="mt-1.5 text-[12px] uppercase tracking-[0.14em] text-champagne-600">{daysText}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label="Fold the menu"
          title="Fold the menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone hover:bg-white/60 hover:text-ink"
        >
          <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <nav aria-label="Main" className="mt-8 flex flex-col gap-0.5">
        {NAV.map((item) =>
          item.href ? (
            <SideLink key={item.label} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} />
          ) : null,
        )}
      </nav>

      <div className="mx-3 mt-6 h-[0.5px] bg-ink/[0.14]" />
      <div className="mt-4 flex flex-col gap-0.5">
        {extras.map((item) => (
          <SideLink key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} count={item.count} />
        ))}
      </div>

      <div className="mt-6">
        <AssistantSheet variant="sidebar" />
      </div>

      <div className="mt-auto">
        <SideLink href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
      </div>
    </aside>
  );
}

function SideLink({ href, icon: Icon, label, active, count }: { href: string; icon: LucideIcon; label: string; active: boolean; count?: number }) {
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${
        active ? "bg-white text-ink shadow-[0_0_0_0.5px_rgb(60_50_40/0.08),0_8px_18px_-12px_rgb(60_50_40/0.35)]" : "text-stone hover:bg-white/60 hover:text-ink"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
      <span className="flex-1">{label}</span>
      {!!count && <span className="text-[13px] text-champagne-600">{count}</span>}
    </Link>
  );
}

function RailLink({ href, icon: Icon, label, active, count }: { href: string; icon: LucideIcon; label: string; active: boolean; count?: number }) {
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={`relative flex h-[60px] w-16 flex-col items-center justify-center gap-1 rounded-[20px] text-[12px] ${
        active ? "bg-white text-ink shadow-[0_0_0_0.5px_rgb(60_50_40/0.08),0_8px_18px_-12px_rgb(60_50_40/0.35)]" : "text-stone hover:bg-white/60 hover:text-ink"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
      {label}
      {!!count && (
        <span className="absolute right-2.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-champagne-600 px-1 text-[12px] text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

/** "Olivia & Theo" → "O&T"; a single name → its first two letters. */
function initialsOf(name: string): string {
  const parts = name.split(/\s*&\s*|\s+and\s+/i).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}&${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
