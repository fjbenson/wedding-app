"use client";

/** "Remove this run sheet" asks first: its moments go with it. */
export default function RemoveSheet({ remove, name }: { remove: () => void | Promise<void>; name: string }) {
  return (
    <form
      action={remove}
      onSubmit={(e) => {
        if (!confirm(`Remove the ${name} run sheet and everything on it? The main run sheet isn't touched.`)) e.preventDefault();
      }}
      className="mt-10 border-t border-linen pt-4 text-center"
    >
      <button type="submit" className="text-sm text-stone underline underline-offset-4 hover:text-ink">
        Remove this run sheet
      </button>
    </form>
  );
}
