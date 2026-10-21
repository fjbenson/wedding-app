import { notFound, redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import NoteEditor from "@/components/note-editor";
import { RemoveButton, SubmitBar } from "@/components/form-bits";
import { getArea } from "@/lib/db/areas";
import { getNote } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";
import { addAreaNoteAction, deleteAreaNoteAction, saveAreaNoteAction } from "../../actions";

export const metadata = { title: "A note — Wedding App" };

/**
 * Writing one of an area's notes on a full screen, like adding inspo (owner,
 * 21 Oct 2026: typed in place under Ideas it felt squished). `?id=` changes
 * one; Save and Back return to the area's Ideas.
 */
export default async function AreaNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ id?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { key } = await params;
  const { id, error, detail } = await searchParams;
  const area = await getArea(wedding.id, decodeURIComponent(key));
  if (!area) notFound();
  const note = id && /^[0-9a-f-]{36}$/i.test(id) ? await getNote(id) : null;
  if (id && (!note || note.area_key !== area.key)) notFound();

  const action = note
    ? saveAreaNoteAction.bind(null, area.key, note.id, note.body && note.url ? note.url : null)
    : addAreaNoteAction.bind(null, area.key);

  return (
    <FormPage backHref={`/area/${area.key}#ideas`} backLabel={area.label} title={note ? "Your note" : `A note for ${area.label}`} error={error} detail={detail}>
      <form action={action}>
        {/* The writing space fills the card down to the toolbar (owner, 21 Oct 2026: one line felt squashed). */}
        <div className="glass-card flex min-h-[55dvh] flex-col rounded-[22px] px-4 py-4">
          <NoteEditor fill initial={note ? (note.body ?? note.url ?? "") : ""} autoFocus={!note} placeholder="A thought, a list, what you've ruled out" />
        </div>
        <SubmitBar label="Save note" whenChanged={!!note} />
      </form>
      {note && (
        <div className="mt-6">
          <RemoveButton action={deleteAreaNoteAction.bind(null, area.key, note.id)} label="Remove this note" question="Remove this note?" />
        </div>
      )}
    </FormPage>
  );
}
