import type { Metadata } from "next";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ContactTypeBadge,
  EmptyState,
  Field,
  Input,
  MilestoneBadge,
  PageHeader,
  RsvpBadge,
  Select,
  SupplierBadge,
  Textarea,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Design system — Wedding App",
  description: "The colours, type and building blocks the app is made from.",
};

/**
 * A living catalogue of the design system.
 *
 * This is not a screen anyone using the app will see — it exists so the look
 * can be judged on a real phone before five screens get built on top of it.
 * Every block below is the actual component, not a picture of one, so if this
 * page looks right the screens will too.
 *
 * Tailwind only keeps the class names it can literally see in the code, so the
 * swatches below are spelled out rather than built from a loop.
 */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-8">
      <h2 className="text-display-sm text-plum-800">{title}</h2>
      {note ? <p className="mt-1.5 max-w-prose text-sm text-ink-muted">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Swatch({
  className,
  name,
  hex,
  dark,
}: {
  className: string;
  name: string;
  hex: string;
  /** True when the swatch is dark enough to need white text on it. */
  dark?: boolean;
}) {
  return (
    <div>
      <div
        className={`flex h-16 items-end rounded-xl border border-black/5 p-2 ${className}`}
      >
        <span
          className={`text-[10px] font-medium ${dark ? "text-white/80" : "text-black/45"}`}
        >
          {hex}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{name}</p>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeader
        title="Design system"
        description="Warm and romantic — cream paper, dusty rose, deep plum ink. Everything the app is built from lives on this page. Open it on your phone and tell me what feels wrong."
      />

      <div className="mt-14 space-y-16">
        {/* ---------------------------------------------------------------- */}
        <Section
          title="Colour"
          note="Five families. Rose leads, plum is the ink, sage and gold are accents, sand is everything quiet. Nothing here is pure white or pure black — that's what keeps it warm."
        >
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-sm font-medium text-plum-700">
                Rose — the primary colour
              </h3>
              <Row>
                <Swatch className="bg-rose-50" name="50" hex="FDF5F3" />
                <Swatch className="bg-rose-100" name="100" hex="FBE9E4" />
                <Swatch className="bg-rose-200" name="200" hex="F5D3C9" />
                <Swatch className="bg-rose-300" name="300" hex="ECB4A5" />
                <Swatch className="bg-rose-400" name="400" hex="DE8E79" />
                <Swatch className="bg-rose-500" name="500" hex="CB705A" dark />
                <Swatch className="bg-rose-600" name="600" hex="B45745" dark />
                <Swatch className="bg-rose-700" name="700" hex="954338" dark />
                <Swatch className="bg-rose-800" name="800" hex="7A3830" dark />
                <Swatch className="bg-rose-900" name="900" hex="64302B" dark />
              </Row>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-plum-700">
                Plum — headings and body text
              </h3>
              <Row>
                <Swatch className="bg-plum-50" name="50" hex="F7F2F3" />
                <Swatch className="bg-plum-100" name="100" hex="EDE0E3" />
                <Swatch className="bg-plum-200" name="200" hex="DBC2C8" />
                <Swatch className="bg-plum-300" name="300" hex="C09AA3" />
                <Swatch className="bg-plum-400" name="400" hex="9E6C78" />
                <Swatch className="bg-plum-500" name="500" hex="7E4C57" dark />
                <Swatch className="bg-plum-600" name="600" hex="663C46" dark />
                <Swatch className="bg-plum-700" name="700" hex="523039" dark />
                <Swatch className="bg-plum-800" name="800" hex="42272E" dark />
                <Swatch className="bg-plum-900" name="900" hex="351F25" dark />
              </Row>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-plum-700">
                Sage — confirmed, done, good news
              </h3>
              <Row>
                <Swatch className="bg-sage-50" name="50" hex="F4F7F2" />
                <Swatch className="bg-sage-100" name="100" hex="E7EDE3" />
                <Swatch className="bg-sage-200" name="200" hex="CFDBC8" />
                <Swatch className="bg-sage-300" name="300" hex="AFC2A5" />
                <Swatch className="bg-sage-400" name="400" hex="8BA37F" />
                <Swatch className="bg-sage-500" name="500" hex="6E8862" dark />
                <Swatch className="bg-sage-600" name="600" hex="566D4D" dark />
                <Swatch className="bg-sage-700" name="700" hex="45573E" dark />
                <Swatch className="bg-sage-800" name="800" hex="394734" dark />
                <Swatch className="bg-sage-900" name="900" hex="2F3B2C" dark />
              </Row>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-plum-700">
                Gold — celebratory touches, used sparingly
              </h3>
              <Row>
                <Swatch className="bg-gold-50" name="50" hex="FDF9F0" />
                <Swatch className="bg-gold-100" name="100" hex="F9F0DC" />
                <Swatch className="bg-gold-200" name="200" hex="F2DFB6" />
                <Swatch className="bg-gold-300" name="300" hex="E7C886" />
                <Swatch className="bg-gold-400" name="400" hex="DAB05C" />
                <Swatch className="bg-gold-500" name="500" hex="C89740" />
                <Swatch className="bg-gold-600" name="600" hex="AC7C33" dark />
                <Swatch className="bg-gold-700" name="700" hex="8B602C" dark />
              </Row>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-plum-700">
                Sand — backgrounds, borders, muted text
              </h3>
              <Row>
                <Swatch className="bg-sand-50" name="50" hex="FDFBF9" />
                <Swatch className="bg-sand-100" name="100" hex="F8F3EE" />
                <Swatch className="bg-sand-200" name="200" hex="EFE6DD" />
                <Swatch className="bg-sand-300" name="300" hex="E1D3C6" />
                <Swatch className="bg-sand-400" name="400" hex="C4B0A0" />
                <Swatch className="bg-sand-500" name="500" hex="A08B7B" />
                <Swatch className="bg-sand-600" name="600" hex="7E6A5C" dark />
                <Swatch className="bg-sand-700" name="700" hex="5F4F44" dark />
                <Swatch className="bg-sand-800" name="800" hex="43382F" dark />
                <Swatch className="bg-sand-900" name="900" hex="2B231D" dark />
              </Row>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Type"
          note="Cormorant Garamond for headings — that's the romance. DM Sans for anything you have to read quickly."
        >
          <Card>
            <CardBody className="space-y-6">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-subtle">
                  Display XL / Cormorant Garamond
                </p>
                <p className="font-display text-display-xl text-plum-800">
                  Frankie &amp; Sam
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-subtle">
                  Display LG
                </p>
                <p className="font-display text-display-lg text-plum-800">
                  12th September 2027
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-subtle">
                  Display MD — screen titles
                </p>
                <p className="font-display text-display-md text-plum-800">
                  Your guest list
                </p>
              </div>
              <div className="border-t border-hairline pt-6">
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-subtle">
                  Body / DM Sans
                </p>
                <p className="max-w-prose text-ink">
                  Ninety-four people invited, sixty-one replied. The florist
                  still hasn&apos;t confirmed, and the final numbers are due to
                  the venue three weeks before the day.
                </p>
                <p className="mt-3 max-w-prose text-sm text-ink-muted">
                  Smaller, muted text for hints and captions like this one.
                </p>
                <p className="mt-3 text-xs text-ink-subtle">
                  Smallest, for timestamps — last updated 2 hours ago.
                </p>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Buttons"
          note="One primary action per screen. Everything else is secondary or ghost."
        >
          <Card>
            <CardBody className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Add a guest</Button>
                <Button variant="secondary">Import from contacts</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="danger">Delete</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="border-t border-hairline pt-6">
                <Button block size="lg">
                  Full width — how it looks on a phone
                </Button>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Forms"
          note="Labels always visible, never placeholder-only — people forget what a box was for once they start typing."
        >
          <Card>
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" required>
                {(props) => <Input {...props} defaultValue="Frankie" />}
              </Field>
              <Field label="Last name">
                {(props) => <Input {...props} defaultValue="Benson" />}
              </Field>
              <Field
                label="Email"
                hint="Only used to send their invitation."
              >
                {(props) => (
                  <Input {...props} type="email" placeholder="name@example.com" />
                )}
              </Field>
              <Field label="Phone" error="That doesn't look like a phone number.">
                {(props) => <Input {...props} defaultValue="0712 34" />}
              </Field>
              <Field label="Type">
                {(props) => (
                  <Select {...props} defaultValue="guest">
                    <option value="guest">Guest</option>
                    <option value="supplier">Supplier</option>
                    <option value="bridal_party">Bridal party</option>
                    <option value="venue">Venue</option>
                  </Select>
                )}
              </Field>
              <Field label="Household">
                {(props) => (
                  <Select {...props}>
                    <option>The Bensons</option>
                    <option>The Carters</option>
                  </Select>
                )}
              </Field>
              <Field
                label="Notes"
                className="sm:col-span-2"
                hint="Allergies, plus-ones, anything you'll forget."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    placeholder="Coeliac — needs a gluten-free main."
                  />
                )}
              </Field>
            </CardBody>
            <CardFooter>
              <Button variant="ghost">Cancel</Button>
              <Button>Save guest</Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Status labels"
          note="These come straight from the database's status values, so a guest who's declined looks the same everywhere in the app."
        >
          <Card>
            <CardBody className="space-y-5">
              <div>
                <p className="mb-2.5 text-xs uppercase tracking-wide text-ink-subtle">
                  RSVP
                </p>
                <div className="flex flex-wrap gap-2">
                  <RsvpBadge status="pending" />
                  <RsvpBadge status="attending" />
                  <RsvpBadge status="declined" />
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs uppercase tracking-wide text-ink-subtle">
                  Timeline
                </p>
                <div className="flex flex-wrap gap-2">
                  <MilestoneBadge status="todo" />
                  <MilestoneBadge status="in_progress" />
                  <MilestoneBadge status="done" />
                  <MilestoneBadge status="skipped" />
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs uppercase tracking-wide text-ink-subtle">
                  Suppliers
                </p>
                <div className="flex flex-wrap gap-2">
                  <SupplierBadge status="researching" />
                  <SupplierBadge status="enquired" />
                  <SupplierBadge status="booked" />
                  <SupplierBadge status="cancelled" />
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs uppercase tracking-wide text-ink-subtle">
                  Who someone is
                </p>
                <div className="flex flex-wrap gap-2">
                  <ContactTypeBadge type="guest" />
                  <ContactTypeBadge type="supplier" />
                  <ContactTypeBadge type="bridal_party" />
                  <ContactTypeBadge type="venue" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Put together"
          note="The same pieces arranged the way the real screens will use them."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Guests"
                description="61 of 94 have replied"
                action={
                  <Button size="sm" variant="secondary">
                    Add
                  </Button>
                }
              />
              <ul className="divide-y divide-hairline">
                {[
                  { name: "Alice Carter", note: "The Carters", status: "attending" },
                  { name: "Ben Okafor", note: "The Okafors", status: "pending" },
                  { name: "Priya Shah", note: "The Shahs", status: "declined" },
                ].map((person) => (
                  <li
                    key={person.name}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <Avatar name={person.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-plum-800">
                        {person.name}
                      </p>
                      <p className="truncate text-sm text-ink-muted">
                        {person.note}
                      </p>
                    </div>
                    <RsvpBadge
                      status={person.status as "attending" | "pending" | "declined"}
                    />
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                title="Next up"
                description="Three things due this month"
              />
              <ul className="divide-y divide-hairline">
                {[
                  { task: "Send save the dates", due: "3 Oct", status: "done" },
                  { task: "Book the florist", due: "14 Oct", status: "in_progress" },
                  { task: "Choose the cake", due: "28 Oct", status: "todo" },
                ].map((item) => (
                  <li
                    key={item.task}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-plum-800">
                        {item.task}
                      </p>
                      <p className="text-sm text-ink-muted">Due {item.due}</p>
                    </div>
                    <MilestoneBadge
                      status={
                        item.status as "done" | "in_progress" | "todo" | "skipped"
                      }
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="Empty states"
          note="What each screen shows before there's anything on it. Worth getting right — it's the first thing a new couple sees."
        >
          <EmptyState
            title="No guests yet"
            description="Add the first few people and their RSVPs will show up here as they reply."
            action={<Button>Add your first guest</Button>}
          />
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          title="The hub"
          note="A rough first pass at the circle-with-dots dashboard from your notes — each dot is an area of the wedding. Not built yet, just here to react to."
        >
          <Card>
            <CardBody className="flex justify-center py-10">
              <div className="relative h-72 w-72">
                <div className="absolute inset-8 rounded-full border border-rose-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-display text-display-sm text-plum-800">
                      342
                    </p>
                    <p className="text-xs uppercase tracking-wide text-ink-muted">
                      days to go
                    </p>
                  </div>
                </div>
                {[
                  { label: "Venue", tone: "bg-sage-200", pos: "left-1/2 top-0 -translate-x-1/2" },
                  { label: "Flowers", tone: "bg-rose-200", pos: "right-0 top-1/4 translate-x-1/4" },
                  { label: "Cake", tone: "bg-gold-200", pos: "right-0 bottom-1/4 translate-x-1/4" },
                  { label: "Guests", tone: "bg-rose-300", pos: "left-1/2 bottom-0 -translate-x-1/2" },
                  { label: "Music", tone: "bg-plum-200", pos: "left-0 bottom-1/4 -translate-x-1/4" },
                  { label: "Photos", tone: "bg-sand-300", pos: "left-0 top-1/4 -translate-x-1/4" },
                ].map((dot) => (
                  <div
                    key={dot.label}
                    className={`absolute ${dot.pos} flex flex-col items-center gap-1`}
                  >
                    <span
                      className={`h-11 w-11 rounded-full ${dot.tone} ring-4 ring-surface`}
                    />
                    <span className="text-[11px] font-medium text-ink-muted">
                      {dot.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section title="Other bits">
          <div className="flex flex-wrap items-center gap-4">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="rose">Rose</Badge>
            <Badge tone="sage">Sage</Badge>
            <Badge tone="gold">Gold</Badge>
            <Badge tone="clay">Clay</Badge>
            <Badge tone="plum">Plum</Badge>
            <Avatar name="Frankie Benson" size="sm" />
            <Avatar name="Frankie Benson" size="md" />
            <Avatar name="Frankie Benson" size="lg" />
          </div>
        </Section>
      </div>
    </main>
  );
}
