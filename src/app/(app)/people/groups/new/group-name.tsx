"use client";

import { useState } from "react";
import { Ideas, TITLE_INPUT } from "@/components/visual-form";

const IDEAS = ["Staying at the pub", "The football lot", "Uni friends", "Work friends", "Neighbours"];

/** The group's name, large, with a few one-tap ideas. */
export default function GroupName() {
  const [name, setName] = useState("");
  return (
    <>
      <input
        name="name"
        required
        autoFocus
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="The group's name"
        placeholder="e.g. Staying at the pub"
        className={TITLE_INPUT}
      />
      <div className="mt-3">
        <Ideas ideas={IDEAS} value={name} onPick={setName} />
      </div>
    </>
  );
}
