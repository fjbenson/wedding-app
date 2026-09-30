import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Plus } from "lucide-react";
import { Field, InlineSubmit, SubmitButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { areaIcon } from "@/lib/areas";
import type { AreaRow, MemberRole, Wedding, WeddingMember } from "@/types/db";
import { moveAreaAction, renameAreaAction, saveWeddingAction, toggleAreaAction } from "./actions";

const ROLE: Record<MemberRole, string> = { owner: "Owner", planner: "Planner", guest: "Guest" };

/** An on/off pill that flips when tapped. */
function Switch({ on, label, action }: { on: boolean; label: string; action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-pressed={on}
        className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs transition ${
          on ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-stone hover:border-champagne-400"
        }`}
      >
        {on && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden />}
        {label}
      </button>
    </form>
  );
}

/**
 * Settings (screen 37): the wedding's names and date; its areas, each with
 * the plan's two separate switches — planning it at all, and showing it as a
 * dot — plus order and name; and who has a login.
 */
export default function SettingsView({
  wedding,
  areas,
  members,
  currentUserId,
  saved,
  error,
  detail,
}: {
  wedding: Wedding;
  areas: AreaRow[];
  members: WeddingMember[];
  currentUserId: string | null;
  saved?: string;
  error?: string;
  detail?: string;
}) {
  const move = "flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-cream disabled:opacity-30";

  return (
    <main className="page pb-28 lg:pb-16">
      <p className="label">Settings</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">Settings</h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      <section className="mt-10">
        <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">The wedding</h2>
        <form action={saveWeddingAction} className="mt-5 space-y-5">
          <Field label="Whose wedding?">
            <input name="name" required defaultValue={wedding.name} className={INPUT} />
          </Field>
          <Field label="The date" hint="if you have one">
            <input name="wedding_date" type="date" defaultValue={wedding.wedding_date ?? ""} className={INPUT} />
          </Field>
          <div className="flex items-center gap-4">
            <div className="flex-1 sm:max-w-xs">
              <SubmitButton label="Save" />
            </div>
            {saved === "wedding" && <span className="text-sm text-stone">Saved.</span>}
          </div>
        </form>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-champagne-400 pb-2">
          <h2 className="text-xl text-ink">Areas</h2>
          <Link href="/area/new" className="inline-flex items-center gap-1 text-sm text-champagne-600 hover:text-ink">
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add an area
          </Link>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          <span className="text-ink">Planning</span> — it shows in to-dos, suppliers and the budget.{" "}
          <span className="text-ink">On the hub</span> — it gets a dot on the ring. The arrows set the order.
        </p>

        {areas.length === 0 ? (
          <p className="mt-4 text-sm text-stone">No areas yet.</p>
        ) : (
          <ul className="mt-3">
            {areas.map((area, index) => {
              const Icon = areaIcon(area.key);
              return (
                <li key={area.id} className="border-b border-linen py-3 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${area.enabled ? "text-champagne-600" : "text-stone/40"}`}
                      strokeWidth={1.8}
                      aria-hidden
                    />
                    <details className="group min-w-0 flex-1">
                      <summary className={`cursor-pointer list-none truncate text-[15px] [&::-webkit-details-marker]:hidden ${area.enabled ? "text-ink" : "text-stone"}`}>
                        {area.label}
                        <span className="ml-2 text-xs text-stone underline underline-offset-4 group-open:hidden">Rename</span>
                      </summary>
                      <form action={renameAreaAction.bind(null, area.id)} className="mt-2 flex items-center gap-2">
                        <input
                          name="label"
                          required
                          defaultValue={area.label}
                          aria-label={`New name for ${area.label}`}
                          className="h-9 min-w-0 flex-1 rounded-full border border-linen bg-white px-3 text-sm text-ink focus:border-champagne-400 focus:outline-none"
                        />
                        <InlineSubmit label="Save" pendingLabel="Saving…" />
                      </form>
                    </details>
                    <form action={moveAreaAction.bind(null, area.id, -1)}>
                      <button type="submit" disabled={index === 0} aria-label={`Move ${area.label} earlier`} className={move}>
                        <ArrowUp className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </button>
                    </form>
                    <form action={moveAreaAction.bind(null, area.id, 1)}>
                      <button
                        type="submit"
                        disabled={index === areas.length - 1}
                        aria-label={`Move ${area.label} later`}
                        className={move}
                      >
                        <ArrowDown className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </button>
                    </form>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 pl-[30px]">
                    <Switch
                      on={area.enabled}
                      label="Planning"
                      action={toggleAreaAction.bind(null, area.id, "enabled", !area.enabled)}
                    />
                    <Switch
                      on={area.show_on_hub}
                      label="On the hub"
                      action={toggleAreaAction.bind(null, area.id, "show_on_hub", !area.show_on_hub)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Who has a login</h2>
        <ul className="mt-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between border-b border-linen py-3 last:border-b-0">
              <span className="text-[15px] text-ink">{m.user_id === currentUserId ? "You, on this device" : "Someone else"}</span>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">{ROLE[m.role]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm leading-relaxed text-ink">
          For now your wedding lives in this browser, on this device — there&apos;s no email sign-in yet, so it
          can&apos;t be opened anywhere else or shared with a partner or planner. That comes with proper sign-in.
        </p>
      </section>
    </main>
  );
}
