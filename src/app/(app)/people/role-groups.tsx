"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, Star, Users, X } from "lucide-react";
import { GUEST_ROLES, rolesOf } from "@/lib/guest-roles";
import type { Contact } from "@/types/db";
import { safely } from "./guest-card";
import { setRolesAction } from "./actions";
import { addToGroupAction, createGroupAction, removeFromGroupAction } from "./group-actions";
import { useGroupSave, type GroupSummary } from "./guest-groups";

/**
 * Role & groups on a guest's card (owner, 23 Oct 2026, canvas 4 "Cards · Round
 * 11", E2): one white field for each kind, the choices as lines inside it with a ✕,
 * and "+ Add …" at its foot opening a tick list under it. No wall of pills —
 * there are fifteen roles. The same star as the list's marks a role, the same
 * people icon as a group's card marks a group.
 */

const FIELD = "mt-2 overflow-hidden rounded-[14px] border border-linen bg-white";
const LINE = "flex min-h-[46px] items-center gap-2.5 border-b border-linen px-3";
const PANEL = "mt-1.5 rounded-2xl bg-white px-3.5 py-1 shadow-[0_18px_40px_-16px_rgb(60_50_40/0.45),0_0_0_1px_#E6E0D6]";

function Tick({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${on ? "bg-champagne-600 text-white" : "border-[1.5px] border-[#CFC4B0]"}`}>
      {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
    </span>
  );
}

function AddRow({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-[46px] w-full items-center gap-2.5 px-3 text-left text-[15px] text-champagne-600">
      <span className="flex-1">+ {label}</span>
      <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} strokeWidth={1.8} aria-hidden />
    </button>
  );
}

export default function RolesAndGroups({
  guest,
  groups,
  onShowGroup,
}: {
  guest: Contact;
  groups?: GroupSummary[];
  /** Tapping a group's name opens its card. */
  onShowGroup?: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="section-label">Role on the day</h3>
      <RoleField guest={guest} />
      {groups && (
        <>
          <h3 className="section-label mt-6">Groups</h3>
          <GroupField guestId={guest.id} firstName={guest.first_name} groups={groups} onShowGroup={onShowGroup} />
        </>
      )}
    </div>
  );
}

function RoleField({ guest }: { guest: Contact }) {
  const [roles, setRoles] = useOptimistic(rolesOf(guest));
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [failed, setFailed] = useState<string>();

  const save = (next: string[]) =>
    startTransition(async () => {
      setRoles(next);
      setFailed((await safely(() => setRolesAction(guest.id, next))).error);
    });
  const toggle = (role: string) => save(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);
  // Their own ones (typed) show in the list too, ticked, so they can be taken off.
  const all = [...GUEST_ROLES, ...roles.filter((r) => !GUEST_ROLES.includes(r))];

  return (
    <>
      <div className={FIELD}>
        {roles.map((role) => (
          <div key={role} className={LINE}>
            <Star className="h-4 w-4 shrink-0 fill-champagne-400 text-champagne-400" strokeWidth={1.4} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{role}</span>
            <button type="button" onClick={() => toggle(role)} aria-label={`Take off ${role}`} className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:text-ink">
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        ))}
        <AddRow label="Add a role" open={open} onToggle={() => setOpen((o) => !o)} />
      </div>
      {open && (
        <div className={PANEL}>
          <ul>
            {all.map((role) => (
              <li key={role} className="border-b border-linen last:border-b-0">
                <button type="button" onClick={() => toggle(role)} aria-pressed={roles.includes(role)} className="flex min-h-11 w-full items-center gap-3 text-left text-[15px] text-ink">
                  <Tick on={roles.includes(role)} />
                  {role}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2 border-t border-linen py-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              if (custom.trim()) save([...roles, custom.trim()]);
              setCustom("");
            }}
          >
            <input
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Your own, e.g. Chief dog handler"
              aria-label="Their own role"
              className="h-11 min-w-0 flex-1 rounded-full border border-linen bg-white px-4 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
            />
            <button type="submit" className="h-11 rounded-full bg-ink px-5 text-sm text-ivory hover:bg-ink/90">
              Add
            </button>
          </form>
        </div>
      )}
      {failed && <p role="alert" className="mt-2 text-sm text-ink">{failed}</p>}
    </>
  );
}

function GroupField({ guestId, firstName, groups, onShowGroup }: { guestId: string; firstName: string; groups: GroupSummary[]; onShowGroup?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { pending, error, run } = useGroupSave();
  const theirs = groups.filter((g) => g.members.includes(guestId));

  return (
    <>
      <div className={FIELD}>
        {theirs.map((g) => (
          <div key={g.id} className={LINE}>
            <Users className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.7} aria-hidden />
            {onShowGroup ? (
              <button type="button" onClick={() => onShowGroup(g.id)} className="min-w-0 flex-1 truncate text-left text-[15px] text-ink hover:underline hover:underline-offset-4">
                {g.name}
              </button>
            ) : (
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{g.name}</span>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => removeFromGroupAction(g.id, guestId))}
              aria-label={`Take ${firstName} out of ${g.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:text-ink disabled:opacity-50"
            >
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        ))}
        <AddRow label="Add to a group" open={open} onToggle={() => setOpen((o) => !o)} />
      </div>
      {open && (
        <div className={PANEL}>
          <ul>
            {groups.map((g) => {
              const on = g.members.includes(guestId);
              return (
                <li key={g.id} className="border-b border-linen last:border-b-0">
                  <button
                    type="button"
                    disabled={pending}
                    aria-pressed={on}
                    onClick={() => run(() => (on ? removeFromGroupAction(g.id, guestId) : addToGroupAction(g.id, guestId)))}
                    className="flex min-h-11 w-full items-center gap-3 text-left text-[15px] text-ink disabled:opacity-60"
                  >
                    <Tick on={on} />
                    <span className="flex-1">{g.name}</span>
                    <span className="text-xs text-stone">{g.members.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="flex items-center gap-2 border-t border-linen py-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createGroupAction(name, guestId), () => setName(""));
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="A new group, e.g. Plus-ones"
              aria-label="A new group"
              className="h-11 min-w-0 flex-1 rounded-full border border-linen bg-white px-4 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
            />
            <button type="submit" disabled={pending || !name.trim()} className="h-11 shrink-0 rounded-full bg-ink px-4 text-sm text-ivory disabled:opacity-40">
              Add
            </button>
          </form>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </>
  );
}
