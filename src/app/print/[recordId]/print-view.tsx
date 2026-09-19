"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CadenceSheet } from "@/components/cadence/cadence-sheet";
import { FoldCard, FOLD_H, FOLD_W } from "@/components/medical-id/fold-card";
import { MedicalIdSheet, SHEET_SIZES, type SheetFormat } from "@/components/medical-id/id-sheet";
import { CARD_H, CARD_W, WalletCardBack, WalletCardFront } from "@/components/medical-id/wallet-card";
import { loadRecords, StorageError } from "@/lib/storage";
import { SELF_RECORD_ID, type HealthRecord } from "@/lib/types";

type Doc = "id" | "cadence";

const PAGE_SIZE: Record<string, string> = {
  wallet: `${CARD_W}mm ${CARD_H}mm`,
  fold: `${FOLD_W}mm ${FOLD_H}mm`,
  a4: "A4 portrait",
  letter: "letter portrait",
};

const TITLES: Record<string, string> = {
  wallet: "Wallet card (85.6 × 54 mm)",
  fold: "Fold-over card",
  a4: "A4 page",
  letter: "US Letter page",
};

const TIPS: Record<string, string> = {
  wallet:
    "Two pages print: the front and the back. Print double-sided with “flip on short edge”, or print single-sided and glue the pages back to back. Set paper size to the custom card size or scale 100% on a normal sheet and cut along the edge.",
  fold: "Cut around the outline, then fold along the dashed line so both sides face out.",
  a4: "Choose A4 paper and set margins to “None” or “Default”. Scale must be 100%.",
  letter: "Choose Letter paper and set margins to “None” or “Default”. Scale must be 100%.",
};

export function PrintView({
  recordId,
  doc,
  format,
}: {
  recordId: string;
  doc: Doc;
  format: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "missing" }
    | { status: "error"; message: string }
    | { status: "ready"; record: HealthRecord }
  >({ status: "loading" });

  useEffect(() => {
    try {
      const record = loadRecords().find((r) => r.id === recordId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(record ? { status: "ready", record } : { status: "missing" });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof StorageError ? e.message : "Something went wrong.",
      });
    }
  }, [recordId]);

  const validFormat =
    doc === "cadence" ? (format === "letter" ? "letter" : "a4") : format in PAGE_SIZE ? format : "wallet";
  const backHref = recordId === SELF_RECORD_ID ? "/my-id" : `/doctor/${recordId}`;

  return (
    <div className="print-root mx-auto max-w-6xl px-4 py-8">
      <style>{`@page { size: ${PAGE_SIZE[validFormat]}; margin: 0; }`}</style>

      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Button nativeButton={false} render={<Link href={backHref} />} variant="outline" className="min-h-12">
          <ArrowLeft aria-hidden="true" /> Back to editing
        </Button>
        <h1 className="text-2xl font-bold">
          {doc === "cadence" ? "Medication schedule" : "Medical ID"} — {TITLES[validFormat]}
        </h1>
        <Button
          size="lg"
          className="ml-auto min-h-14 text-lg"
          onClick={() => window.print()}
          disabled={state.status !== "ready"}
        >
          <Printer aria-hidden="true" /> Print / Save as PDF
        </Button>
      </div>

      {state.status === "loading" && (
        <p role="status" className="py-10 text-center text-muted-foreground">
          Preparing your document…
        </p>
      )}

      {state.status === "missing" && (
        <Alert className="no-print">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Nothing to print yet</AlertTitle>
          <AlertDescription>
            This record is not saved in this browser.{" "}
            <Link href={backHref} className="underline">
              Go back and fill in the details first.
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {state.status === "error" && (
        <Alert variant="destructive" className="no-print">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Could not load saved data</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === "ready" && (
        <>
          <p className="no-print mb-6 max-w-prose rounded-lg bg-secondary p-4">
            <span className="font-bold">Printing tip: </span>
            {TIPS[validFormat]} In the print dialog, choose “Save as PDF” as the destination to
            keep a digital copy.
          </p>
          <div className="flex flex-col items-start gap-6 overflow-x-auto pb-4">
            <Document record={state.record} doc={doc} format={validFormat} />
          </div>
        </>
      )}
    </div>
  );
}

function Document({
  record,
  doc,
  format,
}: {
  record: HealthRecord;
  doc: Doc;
  format: string;
}) {
  const id = record.medicalId;
  if (doc === "cadence") {
    return (
      <div className="flex flex-col gap-6 print:gap-0">
        <CadenceSheet id={id} cadence={record.cadence} format={format as SheetFormat} />
      </div>
    );
  }
  if (format === "wallet") {
    return (
      <>
        <div className="print-page">
          <WalletCardFront id={id} />
        </div>
        <div className="print-page">
          <WalletCardBack id={id} />
        </div>
      </>
    );
  }
  if (format === "fold") {
    return (
      <div className="print-page">
        <FoldCard id={id} />
      </div>
    );
  }
  return (
    <div className="shadow-lg print:shadow-none" style={{ width: `${SHEET_SIZES[format as SheetFormat].w}mm` }}>
      <MedicalIdSheet id={id} format={format as SheetFormat} />
    </div>
  );
}
