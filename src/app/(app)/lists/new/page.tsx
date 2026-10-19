import { redirect } from "next/navigation";

/** Lists folded into notes (owner, 19 Oct 2026): an old "new list" link opens Jot a note, where tick-boxes are one tap. */
export default function NewListPage() {
  redirect("/capture?from=/inbox");
}
