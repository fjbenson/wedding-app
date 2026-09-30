"use client";

import { useState } from "react";
import { InlineSubmit } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { GUEST_ROLES } from "@/lib/guest-roles";
import { assignRoleAction } from "./actions";

/** "Give someone a role": pick a guest, pick a job, done. */
export default function RolePicker({ guests }: { guests: { id: string; name: string }[] }) {
  const [role, setRole] = useState("");

  return (
    <form action={assignRoleAction} className="mt-6 rounded-2xl border border-linen bg-white p-5">
      <p className="label font-body">Give someone a role</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <select name="guest" required defaultValue="" aria-label="Guest" className={INPUT}>
          <option value="" disabled>
            Who?
          </option>
          {guests.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          name="role"
          required
          value={role}
          onChange={(event) => setRole(event.target.value)}
          aria-label="Role"
          className={INPUT}
        >
          <option value="" disabled>
            Their role
          </option>
          {GUEST_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="other">Something else…</option>
        </select>
        <div className="sm:pb-0.5">
          <InlineSubmit label="Add" pendingLabel="Adding…" />
        </div>
      </div>
      {role === "other" && (
        <input name="custom_role" required placeholder="e.g. Chief dog handler" aria-label="Their role" className={INPUT} />
      )}
    </form>
  );
}
