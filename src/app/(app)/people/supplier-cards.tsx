"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { replaceQuery } from "@/lib/url-state";
import type { Payment } from "@/types/db";
import SupplierCard from "./supplier-card";
import { useCycle, useRegisterCycle } from "@/lib/card-cycle";

const OpenSupplier = createContext<(id: string) => void>(() => {});

/**
 * Lets a page open a supplier's card over itself rather than jumping to
 * People (owner, 12 Oct 2026: the area page is where you decide, the card
 * is that supplier's details, wherever you are). The open card lives in
 * the address as ?supplier=, so Back from something it links to returns to
 * it. Wrap the page in this, and use `SupplierLink` for the taps.
 */
export function SupplierCards({
  suppliers,
  areas,
  payments,
  children,
}: {
  suppliers: Supplier[];
  areas: (AreaOption & { budget?: number | null })[];
  payments: Payment[];
  children: React.ReactNode;
}) {
  const params = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(params.get("supplier"));
  useEffect(() => {
    replaceQuery({ supplier: openId });
  }, [openId]);
  const close = useCallback(() => setOpenId(null), []);
  const open = suppliers.find((s) => s.id === openId);
  useRegisterCycle("supplier", suppliers.map((s) => s.id), setOpenId);
  const cycle = useCycle("supplier", openId);

  return (
    <OpenSupplier.Provider value={setOpenId}>
      {children}
      {open && (
        <SupplierCard
          key={open.id}
          cycle={cycle}
          supplier={open}
          areas={areas}
          payments={payments.filter((p) => p.contact_id === open.id)}
          onClose={close}
        />
      )}
    </OpenSupplier.Provider>
  );
}

/** A tap that opens a supplier's card (inside `SupplierCards`). */
export function SupplierLink({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  const open = useContext(OpenSupplier);
  return (
    <button type="button" onClick={() => open(id)} className={`text-left ${className ?? ""}`}>
      {children}
    </button>
  );
}
