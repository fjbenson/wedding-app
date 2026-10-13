"use server";

import { revalidatePath } from "next/cache";
import { createFile, deleteFile, listSupplierFiles, type FileWithLink } from "@/lib/db/files";
import { getCurrentWedding } from "@/lib/db/weddings";
import type { FileKind } from "@/types/db";

/*
 * Files on a supplier's card (canvas 2 "Files · Round 1"). Called from the
 * card, so each returns a message rather than throwing or redirecting.
 */

const KINDS: FileKind[] = ["contract", "quote", "invoice", "receipt", "other"];

/** A supplier's files with links to open them; `ready: false` until 0018_files.sql is run. */
export async function supplierFilesAction(contactId: string): Promise<{ files: FileWithLink[]; ready: boolean; error?: string }> {
  try {
    const files = await listSupplierFiles(contactId);
    return { files: files ?? [], ready: files !== null };
  } catch (error) {
    console.error("files didn't load", error);
    return { files: [], ready: true, error: "The files didn't load. Try again in a moment." };
  }
}

/** Records a file that's just been uploaded from the phone. */
export async function addFileAction(input: {
  contactId: string | null;
  areaKey: string | null;
  kind: string;
  signed: boolean;
  name: string;
  path: string;
  size: number;
  mime: string;
}): Promise<{ error?: string }> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Sign in again, then try once more." };
  if (!input.path.startsWith(`${wedding.id}/`)) return { error: "That file didn't save." };
  const kind = (KINDS as string[]).includes(input.kind) ? (input.kind as FileKind) : "other";
  try {
    await createFile(wedding.id, {
      contact_id: input.contactId,
      area_key: input.areaKey,
      kind,
      signed: kind === "contract" && input.signed,
      name: input.name.slice(0, 200) || "File",
      path: input.path,
      size_bytes: input.size,
      mime_type: input.mime || null,
    });
  } catch (error) {
    console.error("file didn't save", error);
    return { error: "That file didn't save. Try again." };
  }
  revalidatePath("/people");
  revalidatePath("/area/[key]", "page");
  return {};
}

export async function removeFileAction(fileId: string): Promise<{ error?: string }> {
  try {
    await deleteFile(fileId);
  } catch (error) {
    console.error("file didn't go", error);
    return { error: "That didn't remove it. Try again." };
  }
  revalidatePath("/people");
  revalidatePath("/area/[key]", "page");
  return {};
}
