import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Field, SubmitButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { STARTER_AREAS } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { createWeddingAction, saveAreasAction } from "./actions";

export const metadata = { title: "Set up your wedding — Wedding App" };

/**
 * First-run setup (screen 2 in docs/information-architecture.md): name the
 * couple and the date, then choose which areas of the wedding apply. Anyone
 * who has already done both is sent to the hub.
 */
export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
  const wedding = await getCurrentWedding();

  let step: 1 | 2 = 1;
  if (wedding) {
    const areas = await listAreas(wedding.id);
    // Already chosen, or no areas table to choose into yet: nothing to do here.
    if (areas === null || areas.length > 0) redirect("/");
    step = 2;
  }

  return (
    <main className="page flex flex-col pb-16">
      <div className="mx-auto w-full max-w-md py-6">
        <p className="label">Step {step} of 2</p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
            {error}
            {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
          </p>
        )}

        {step === 1 ? <TheCouple /> : <TheAreas />}
      </div>
    </main>
  );
}

function TheCouple() {
  return (
    <>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        Let&apos;s start with the two of you.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        First names are plenty. You can change any of this later.
      </p>

      <form action={createWeddingAction} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="You">
            <input name="you" required autoComplete="given-name" placeholder="Frankie" className={INPUT} />
          </Field>
          <Field label="Your partner">
            <input name="partner" placeholder="Sam" className={INPUT} />
          </Field>
        </div>

        <Field label="The date" hint="if you have one">
          <input name="wedding_date" type="date" className={INPUT} />
        </Field>

        <SubmitButton label="Next" />
      </form>
    </>
  );
}

function TheAreas() {
  return (
    <>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        Which of these are you planning?
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        Each one becomes a dot on your hub. Untick anything you&apos;re not doing — you can switch
        it back on later.
      </p>

      <form action={saveAreasAction} className="mt-8 space-y-6">
        <fieldset>
          <legend className="sr-only">Areas</legend>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_AREAS.map((area) => {
              const Icon = area.icon;
              return (
                <label key={area.key} className="cursor-pointer">
                  <input type="checkbox" name="area" value={area.key} defaultChecked className="peer sr-only" />
                  {/* Ticked: white card, dark edge, a tick. Unticked: faded, dashed. */}
                  <span className="flex h-12 items-center gap-2.5 rounded-xl border border-dashed border-linen px-3 text-sm leading-tight text-stone/70 transition peer-checked:border-solid peer-checked:border-ink peer-checked:bg-white peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400/40 [&>.tick]:opacity-0 peer-checked:[&>.tick]:opacity-100 [&>svg:first-child]:opacity-40 peer-checked:[&>svg:first-child]:opacity-100">
                    <Icon className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{area.label}</span>
                    <Check className="tick h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Anything else?" hint="separate with commas">
          <input name="extra" placeholder="e.g. Honeymoon, Fireworks" className={INPUT} />
        </Field>

        <SubmitButton label="Take me to the hub" />
      </form>
    </>
  );
}
