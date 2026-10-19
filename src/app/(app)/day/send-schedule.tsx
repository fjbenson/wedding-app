"use client";

import { Mail } from "lucide-react";

/**
 * "Email it to them" under a group's schedule: opens the couple's own email
 * with the group in Bcc and the schedule written in. The app sends and keeps
 * nothing, and the group's addresses stay on this phone.
 */
export default function SendSchedule({ group, subject, text, emails }: { group: string; subject: string; text: string; emails: string[] }) {
  if (emails.length === 0) return <p className="text-center text-xs text-stone">No one in {group} has an email yet.</p>;
  const enc = encodeURIComponent;
  return (
    <a
      href={`mailto:?bcc=${emails.map(enc).join(",")}&subject=${enc(subject)}&body=${enc(text)}`}
      className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] text-ivory"
    >
      <Mail className="h-4 w-4" strokeWidth={1.7} aria-hidden />
      Email it to {group}
    </a>
  );
}
