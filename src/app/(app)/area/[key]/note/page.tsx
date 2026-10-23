import { notFound, redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import AreaNoteForm from "./area-note-form";
import { RemoveButton } from "@/components/form-bits";
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
    ? saveAreaNoteAction.bind(null, area.key, note.id)
    : addAreaNoteAction.bind(null, area.key);

  return (
    <FormPage backHref={`/area/${area.key}#ideas`} backLabel={area.label} title={note ? "Your note" : `A note for ${area.label}`} error={error} detail={detail}>
      <AreaNoteForm
        action={action}
        initial={note ? (note.body ?? note.url ?? "") : ""}
        link={note && note.body && note.url ? note.url : ""}
        isNew={!note}
        showLink={!note || !!note.body}
      />
      {note && (
        <div className="mt-6">
          <RemoveButton action={deleteAreaNoteAction.bind(null, area.key, note.id)} label="Remove this note" question="Remove this note?" />
        </div>
      )}
    </FormPage>
  );
}
