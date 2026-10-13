"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { addFileAction, removeFileAction, supplierFilesAction } from "@/app/(app)/files/actions";
import { MAX_FILE_BYTES, uploadWeddingFile } from "@/lib/db/files-upload";
import type { FileWithLink } from "@/lib/db/files";
import { formatDayMonth } from "@/lib/dates";
import type { FileKind } from "@/types/db";

const KINDS: { value: FileKind; label: string }[] = [
  { value: "contract", label: "Contract" },
  { value: "quote", label: "Quote" },
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
];
const ACCEPT = "application/pdf,image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** "Ellie Rose contract.pdf" → a contract. A guess the couple can change. */
function guessKind(name: string): FileKind {
  const n = name.toLowerCase();
  if (/contract|agreement|terms/.test(n)) return "contract";
  if (/quote|quotation|estimate|proposal|package/.test(n)) return "quote";
  if (/invoice|bill/.test(n)) return "invoice";
  if (/receipt/.test(n)) return "receipt";
  return "other";
}

function extension(name: string, mime: string | null) {
  if (mime?.startsWith("image/")) return "IMG";
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  return ext && ext.length <= 4 ? ext : "FILE";
}

function size(bytes: number | null) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A small page with a folded corner, the file's type on it. */
function FileIcon({ label }: { label: string }) {
  return (
    <span className="relative flex h-[46px] w-[38px] shrink-0 items-end justify-center rounded-md border border-linen bg-[#FFFDF8] pb-1.5 text-[10px] font-semibold tracking-[0.06em] text-champagne-600">
      <span aria-hidden className="absolute -right-px -top-px h-[11px] w-[11px] rounded-bl border-b border-l border-linen bg-ivory" />
      {label}
    </span>
  );
}

/**
 * Documents on a supplier's card (canvas 2 "Files · Round 1", A; owner's
 * pick 13 Oct 2026): each file with what it is, tapped to open; "+ Add a
 * file" brings up the phone's own menu (Photo Library · Take Photo · Choose
 * File — round 2, option C: the screen people already know), then a small
 * pop-up in the middle asks what it is, and saves.
 */
export default function SupplierFiles({
  supplierId,
  weddingId,
  areaKey,
  supplierName,
}: {
  supplierId: string;
  weddingId: string;
  areaKey: string | null;
  supplierName: string;
}) {
  const [files, setFiles] = useState<FileWithLink[] | null>(null);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<string>();
  const [picked, setPicked] = useState<File | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const result = await supplierFilesAction(supplierId);
      setFiles(result.files);
      setReady(result.ready);
      setError(result.error);
    } catch {
      setFiles([]);
      setError("The files didn't load. Try again in a moment.");
    }
  }, [supplierId]);
  useEffect(() => {
    load();
  }, [load]);

  if (!ready) return null; // 0018_files.sql not run yet

  const choose = () => input.current?.click();

  return (
    <section className="mt-7">
      <h2 className="section-label font-body">Documents</h2>
      <div className="mt-3 overflow-hidden rounded-[18px] border border-linen bg-white/75">
        {(files ?? []).map((f) => (
          <div key={f.id} className="flex items-center gap-3 border-b border-linen px-3.5 py-3">
            <a href={f.link ?? undefined} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-3">
              <FileIcon label={extension(f.name, f.mime_type)} />
              <span className="min-w-0 flex-1">
                <span className="type-item block truncate">{f.name}</span>
                <span className="mt-1 flex items-center gap-2 text-[13px] text-stone">
                  <span className="rounded-full bg-champagne-100 px-2 py-0.5 text-[12px] font-medium text-champagne-600">
                    {KINDS.find((k) => k.value === f.kind)?.label}
                  </span>
                  {f.signed ? "Signed · " : ""}
                  {formatDayMonth(f.created_at.slice(0, 10))}
                </span>
              </span>
            </a>
            {removing === f.id ? (
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    const result = await removeFileAction(f.id).catch(() => ({ error: "That didn't remove it. Try again." }));
                    setRemoving(null);
                    if (result.error) setError(result.error);
                    else load();
                  }}
                  className="rounded-full bg-ink px-3 py-1.5 text-[13px] text-ivory"
                >
                  Remove
                </button>
                <button type="button" onClick={() => setRemoving(null)} className="px-2 py-1.5 text-[13px] text-stone">
                  Keep
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setRemoving(f.id)}
                aria-label={`Remove ${f.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.6} aria-hidden />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={choose}
          className="flex w-full items-center gap-2.5 px-3.5 py-3.5 text-[15px] text-champagne-600 hover:bg-cream/60"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add a file
          <span className="ml-auto text-[13px] text-stone">PDF, photo or Word</span>
        </button>
      </div>
      {/* The phone shows its own menu for this: Photo Library · Take Photo · Choose File. */}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > MAX_FILE_BYTES) {
            setError("That file is over 20 MB. Try a smaller copy, or a photo of it.");
            return;
          }
          setError(undefined);
          setPicked(file);
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
      {picked && (
        <WhatIsIt
          file={picked}
          supplierName={supplierName}
          onChange={choose}
          onClose={() => setPicked(null)}
          onSave={async (kind, signed) => {
            const path = await uploadWeddingFile(weddingId, picked);
            const result = await addFileAction({
              contactId: supplierId,
              areaKey,
              kind,
              signed,
              name: picked.name,
              path,
              size: picked.size,
              mime: picked.type,
            });
            if (result.error) throw new Error(result.error);
            setPicked(null);
            load();
          }}
        />
      )}
    </section>
  );
}

/** The pop-up in the middle, once a file's picked: what is it, and save. */
function WhatIsIt({
  file,
  supplierName,
  onChange,
  onClose,
  onSave,
}: {
  file: File;
  supplierName: string;
  onChange: () => void;
  onClose: () => void;
  onSave: (kind: FileKind, signed: boolean) => Promise<void>;
}) {
  const [kind, setKind] = useState<FileKind>(() => guessKind(file.name));
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    setKind(guessKind(file.name));
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [file, onClose, saving]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-label="Add a file">
      <button type="button" aria-label="Close" onClick={() => !saving && onClose()} className="absolute inset-0 h-full w-full cursor-default bg-ink/40" />
      <div className="relative w-full max-w-sm rounded-[26px] bg-ivory p-5 shadow-[0_30px_70px_-20px_rgb(30_27_24/0.55)]">
        <div className="flex items-center justify-between">
          <p className="section-label">Add a file</p>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-stone hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 font-display text-[19px] font-light leading-snug">
          For <em className="text-champagne-600">{supplierName}</em>
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-linen bg-white/80 px-3.5 py-3">
          <FileIcon label={extension(file.name, file.type)} />
          <span className="min-w-0 flex-1">
            <span className="type-item block truncate">{file.name}</span>
            <span className="text-[13px] text-stone">{size(file.size)}</span>
          </span>
          <button type="button" onClick={onChange} disabled={saving} className="shrink-0 text-[13px] text-champagne-600 hover:text-ink">
            Change
          </button>
        </div>

        <p className="section-label mt-5">What is it?</p>
        <div role="radiogroup" aria-label="What is it?" className="mt-2.5 grid grid-cols-3 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={kind === k.value}
              onClick={() => setKind(k.value)}
              className={`h-12 rounded-2xl border text-[14px] transition ${
                kind === k.value ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {kind === "contract" && (
          <button
            type="button"
            role="checkbox"
            aria-checked={signed}
            onClick={() => setSigned((s) => !s)}
            className="mt-4 flex items-center gap-2.5 text-[15px] text-ink"
          >
            <span
              aria-hidden
              className={`flex h-[22px] w-[22px] items-center justify-center rounded-md ${signed ? "bg-ink text-ivory" : "border-[1.5px] border-stone/50 bg-white"}`}
            >
              {signed && <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
            </span>
            We&apos;ve signed it
          </button>
        )}

        {problem && (
          <p role="alert" className="mt-3 text-sm text-ink">
            {problem}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setProblem(undefined);
            try {
              await onSave(kind, signed);
            } catch (error) {
              console.error("file didn't save", error);
              setProblem(error instanceof Error && error.message.startsWith("That") ? error.message : "The file didn't upload. Check your connection and try again.");
              setSaving(false);
            }
          }}
          className="mt-5 h-[52px] w-full rounded-full bg-ink text-[15px] text-ivory transition hover:bg-ink/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save the file"}
        </button>
      </div>
    </div>
  );
}
