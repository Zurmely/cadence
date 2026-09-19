"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CalendarClock, CreditCard, FileText, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalIdForm } from "@/components/medical-id/medical-id-form";
import { WalletCardBack, WalletCardFront } from "@/components/medical-id/wallet-card";
import { CadenceForm } from "@/components/cadence/medication-form";
import { CadenceSheet } from "@/components/cadence/cadence-sheet";
import { useRecord } from "@/hooks/use-records";
import type { HealthRecord } from "@/lib/types";

export const ID_FORMATS = [
  { key: "wallet", label: "Wallet card", detail: "85.6 × 54 mm, front and back" },
  { key: "fold", label: "Fold-over card", detail: "One sheet, folds to wallet size" },
  { key: "a4", label: "A4 page", detail: "210 × 297 mm" },
  { key: "letter", label: "US Letter page", detail: "8.5 × 11 in" },
] as const;

export const CADENCE_FORMATS = [
  { key: "a4", label: "A4 page", detail: "210 × 297 mm" },
  { key: "letter", label: "US Letter page", detail: "8.5 × 11 in" },
] as const;

type Props = {
  recordId: string;
  kind: HealthRecord["kind"];
  title: string;
  backHref?: string;
};

export function RecordEditor({ recordId, kind, title, backHref }: Props) {
  const { state, draft, update, saveError, notFound } = useRecord(recordId, kind);
  const [tab, setTab] = useState("id");

  if (state.status === "error") {
    return (
      <Alert variant="destructive" className="mx-auto mt-10 max-w-xl">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>Could not load saved data</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto mt-10 max-w-xl space-y-4 text-center">
        <h1 className="text-2xl font-bold">Patient not found</h1>
        <p className="text-muted-foreground">
          This patient record does not exist in this browser. It may have been deleted.
        </p>
        <Button nativeButton={false} render={<Link href="/doctor" />} className="min-h-12">
          Back to patient list
        </Button>
      </div>
    );
  }

  if (state.status === "loading" || !draft) {
    return (
      <p role="status" className="p-10 text-center text-muted-foreground">
        Loading your saved details…
      </p>
    );
  }

  const canPrint = draft.medicalId.fullName.trim().length > 0;
  const printBase = `/print/${draft.id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {backHref && (
            <Link href={backHref} className="text-primary underline underline-offset-4">
              ← All patients
            </Link>
          )}
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Changes save automatically in this browser.
          </p>
        </div>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Not saved</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 h-auto flex-wrap">
          <TabsTrigger value="id" className="min-h-12 px-4 text-base">
            <CreditCard aria-hidden="true" /> Medical ID
          </TabsTrigger>
          <TabsTrigger value="cadence" className="min-h-12 px-4 text-base">
            <CalendarClock aria-hidden="true" /> Medication schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="id">
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)]">
            <MedicalIdForm
              value={draft.medicalId}
              onChange={(medicalId) => update((r) => ({ ...r, medicalId }))}
            />
            <aside aria-labelledby="preview-heading" className="lg:sticky lg:top-6 lg:self-start">
              <h2 id="preview-heading" className="mb-3 text-xl font-bold">
                Live preview
              </h2>
              <div className="space-y-4 overflow-x-auto rounded-xl bg-muted p-4">
                <WalletCardFront id={draft.medicalId} />
                <WalletCardBack id={draft.medicalId} />
              </div>
              <PrintMenu
                heading="Print your Medical ID"
                base={`${printBase}?doc=id`}
                formats={ID_FORMATS}
                disabled={!canPrint}
                disabledReason="Add a name first, then you can print."
              />
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="cadence">
          <div className="grid gap-10 xl:grid-cols-[1fr_minmax(0,460px)]">
            <CadenceForm
              value={draft.cadence}
              onChange={(cadence) => update((r) => ({ ...r, cadence }))}
            />
            <aside aria-labelledby="cadence-preview-heading" className="xl:sticky xl:top-6 xl:self-start">
              <h2 id="cadence-preview-heading" className="mb-3 text-xl font-bold">
                Live preview
              </h2>
              <div className="overflow-auto rounded-xl bg-muted p-4" style={{ maxHeight: "70vh" }}>
                <div style={{ zoom: 0.55 }}>
                  <CadenceSheet id={draft.medicalId} cadence={draft.cadence} format="a4" />
                </div>
              </div>
              <PrintMenu
                heading="Print the schedule"
                base={`${printBase}?doc=cadence`}
                formats={CADENCE_FORMATS}
                disabled={!canPrint || draft.cadence.medications.length === 0}
                disabledReason="Add a name and at least one medicine to print."
              />
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrintMenu({
  heading,
  base,
  formats,
  disabled,
  disabledReason,
}: {
  heading: string;
  base: string;
  formats: ReadonlyArray<{ key: string; label: string; detail: string }>;
  disabled: boolean;
  disabledReason: string;
}) {
  return (
    <section aria-labelledby={`${heading}-h`} className="mt-6">
      <h3 id={`${heading}-h`} className="mb-2 flex items-center gap-2 text-lg font-bold">
        <Printer className="size-5" aria-hidden="true" /> {heading}
      </h3>
      {disabled && <p className="mb-2 text-muted-foreground">{disabledReason}</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {formats.map((f) => (
          <li key={f.key}>
            {disabled ? (
              <span
                aria-disabled="true"
                className="flex min-h-14 flex-col justify-center rounded-lg border px-3 py-2 opacity-60"
              >
                <span className="font-bold">{f.label}</span>
                <span className="text-sm text-muted-foreground">{f.detail}</span>
              </span>
            ) : (
              <Link
                href={`${base}&format=${f.key}`}
                className="flex min-h-14 flex-col justify-center rounded-lg border-2 px-3 py-2 hover:border-primary hover:bg-secondary"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <FileText className="size-4" aria-hidden="true" /> {f.label}
                </span>
                <span className="text-sm text-muted-foreground">{f.detail}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
