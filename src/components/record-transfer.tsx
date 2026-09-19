"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  createRecordExport,
  parseRecordImport,
} from "@/lib/record-transfer";
import type { HealthRecord } from "@/lib/types";

type Props = {
  records: HealthRecord[];
  onImport: (records: HealthRecord[]) => void;
  scopeLabel: string;
};

export function RecordTransfer({ records, onImport, scopeLabel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | undefined
  >();

  const exportRecords = () => {
    if (records.length === 0) return;
    const blob = new Blob([JSON.stringify(createRecordExport(records), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cadence-records-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({
      kind: "success",
      text: `${records.length} record${records.length === 1 ? "" : "s"} exported.`,
    });
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseRecordImport(await file.text());
      onImport(imported);
      setMessage({
        kind: "success",
        text: `${imported.length} record${imported.length === 1 ? "" : "s"} imported. Existing records with the same ID were replaced.`,
      });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "The file could not be imported.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section aria-labelledby="record-transfer-heading" className="mt-8 rounded-xl border p-4">
      <h2 id="record-transfer-heading" className="text-lg font-bold">
        Move records between devices
      </h2>
      <p className="mt-1 text-muted-foreground">
        Export {scopeLabel} as a JSON backup, or import a Cadence backup. Files stay on
        your device unless you choose to share them.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          onClick={exportRecords}
          disabled={records.length === 0}
        >
          <Download aria-hidden="true" /> Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          onClick={() => inputRef.current?.click()}
        >
          <Upload aria-hidden="true" /> Import JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choose a Cadence JSON backup to import"
          onChange={(event) => void importFile(event.target.files?.[0])}
        />
      </div>
      {records.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          There are no records to export yet. You can still import a backup.
        </p>
      )}
      {message && (
        <Alert
          variant={message.kind === "error" ? "destructive" : "default"}
          className="mt-4"
          role={message.kind === "error" ? "alert" : "status"}
        >
          <AlertTitle>{message.kind === "error" ? "Import failed" : "Done"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
