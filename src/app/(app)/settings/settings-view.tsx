import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Plus } from "lucide-react";
import { DateInput, Field, InlineSubmit, SubmitBar } from "@/components/form-bits";
import ResetBoundary from "@/components/reset-boundary";
import { INPUT } from "@/components/form-styles";
import { areaIcon } from "@/lib/areas";
import type { Login } from "@/lib/db/auth";
import type { AreaRow, MemberRole, Wedding, WeddingMember } from "@/types/db";
import { moveAreaAction, renameAreaAction, saveWeddingAction, switchWeddingAction, toggleAreaAction } from "./actions";

const ROLE: Record<MemberRole, string> = { owner: "Owner", planner: "Planner", guest: "Guest" };

/** An on/off pill that flips when tapped. */
function Switch({ on, label, action }: { on: boolean; label: string; action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-pressed={on}
        className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs transition ${
          on ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-white/80 bg-white/50 text-stone hover:border-champagne-400"
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
  weddings,
  areas,
  members,
  login,
  saved,
  error,
  detail,
}: {
  wedding: Wedding;
  weddings: Wedding[];
  areas: AreaRow[];
  members: WeddingMember[];
  login: Login | null;
  saved?: string;
  error?: string;
  detail?: string;
}) {
  const currentUserId = login?.id ?? null;
  const move = "flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-cream disabled:opacity-30";

  return (
    <main className="page pb-40 lg:max-w-[1180px] lg:pb-16">
      <h1 className="type-display mt-3 text-[32px] leading-[1.1] tracking-[-0.02em]">Settings</h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {/* On a laptop two columns (owner, 23 Oct 2026): the wedding, logins and weddings down the left, the long list of areas beside them. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_1fr] lg:items-start lg:gap-x-8">
      <section className="glass-card mt-6 rounded-[22px] p-5 lg:col-start-1">
        <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">The wedding</h2>
        {/* Save only rises once something has changed. */}
        <ResetBoundary>
          <form action={saveWeddingAction} className="mt-5 space-y-5">
            <Field label="Whose wedding?">
              <input name="name" required defaultValue={wedding.name} className={INPUT} />
            </Field>
            <Field label="The date" hint="if you have one">
              <DateInput name="wedding_date" defaultValue={wedding.wedding_date ?? ""} className={INPUT} />
            </Field>
            <SubmitBar label="Save" whenChanged />
          </form>
        </ResetBoundary>
      </section>

      <section className="glass-card mt-6 rounded-[22px] p-5 lg:col-start-2 lg:row-span-4 lg:row-start-1">
        <div className="flex items-baseline justify-between border-b border-champagne-400 pb-2">
          <h2 className="text-xl text-ink">Areas</h2>
          <Link href="/area/new" className="inline-flex items-center gap-1 text-sm text-champagne-600 hover:text-ink">
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add an area
          </Link>
        </div>

        {areas.length === 0 ? (
          <p className="mt-4 text-sm text-stone">No areas yet.</p>
        ) : (
          <ul className="mt-3 xl:grid xl:grid-cols-2 xl:gap-x-8">
            {areas.map((area, index) => {
              const Icon = areaIcon(area.key, area.icon);
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

      <div className="lg:col-start-1">
        <YourWeddings weddings={weddings} openId={wedding.id} />
      </div>

      <section className="glass-card mt-6 rounded-[22px] p-5 lg:col-start-1">
        <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Who has a login</h2>
        <ul className="mt-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between border-b border-linen py-3 last:border-b-0">
              <span className="text-[15px] text-ink">{m.user_id === currentUserId ? "You, on this device" : "Someone else"}</span>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">{ROLE[m.role]}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="lg:col-start-1">
        <YourLogin login={login} />
      </div>
      </div>
    </main>
  );
}

/**
 * Only shown when this login belongs to more than one wedding (the demo,
 * 12 Oct 2026): tap one to open it on this device.
 */
function YourWeddings({ weddings, openId }: { weddings: Wedding[]; openId: string }) {
  if (weddings.length < 2) return null;
  return (
    <section className="glass-card mt-6 rounded-[22px] p-5">
      <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Your weddings</h2>
      <ul className="mt-2">
        {weddings.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 border-b border-linen py-3 last:border-b-0">
            <span className="min-w-0 truncate font-display text-lg text-ink">{w.name}</span>
            {w.id === openId ? (
              <span className="flex shrink-0 items-center gap-1 text-xs uppercase tracking-[0.14em] text-champagne-600">
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Open
              </span>
            ) : (
              <form action={switchWeddingAction}>
                <input type="hidden" name="wedding_id" value={w.id} />
                <button type="submit" className="h-10 shrink-0 rounded-full border border-linen px-4 text-sm text-ink hover:bg-cream">
                  Open this one
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Who's signed in, and the way out. */
function YourLogin({ login }: { login: Login | null }) {
  if (!login?.email) return null;
  return (
    <section className="glass-card mt-8 rounded-[22px] p-5">
      <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Your login</h2>
      <p className="mt-4 text-sm text-stone">
        Signed in as <span className="text-ink">{login.email}</span>
      </p>
      <form action="/auth/sign-out" method="post" className="mt-4">
        <button type="submit" className="h-11 rounded-full border border-linen px-5 text-sm text-ink hover:bg-cream">
          Sign out
        </button>
      </form>
    </section>
  );
}
