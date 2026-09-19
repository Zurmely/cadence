"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CalendarClock, Plus, Trash2, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecords } from "@/hooks/use-records";
import { formatDate, newRecord, type HealthRecord } from "@/lib/types";

export default function DoctorPage() {
  const router = useRouter();
  const { state, upsert, remove, saveError } = useRecords();
  const [pendingDelete, setPendingDelete] = useState<HealthRecord | null>(null);

  const addPatient = () => {
    const record = newRecord("patient");
    upsert(record);
    router.push(`/doctor/${record.id}`);
  };

  const patients =
    state.status === "ready"
      ? state.records
          .filter((r) => r.kind === "patient")
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Doctor mode</h1>
          <p className="mt-1 max-w-prose text-muted-foreground">
            Create Medical IDs and Medication Cadence schedules for your patients. Records
            are kept only in this browser — clear them before using a shared computer.
          </p>
        </div>
        <Button onClick={addPatient} disabled={state.status !== "ready"} className="min-h-12 text-base">
          <Plus aria-hidden="true" /> New patient
        </Button>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Not saved</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {state.status === "loading" && (
        <p role="status" className="py-10 text-center text-muted-foreground">
          Loading patients…
        </p>
      )}

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Could not load patients</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === "ready" && patients.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <UserRound className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">No patients yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
            Add a patient to build their Medical ID card and a daily medicine schedule.
          </p>
          <Button onClick={addPatient} className="mt-4 min-h-12">
            <Plus aria-hidden="true" /> Add your first patient
          </Button>
        </div>
      )}

      {patients.length > 0 && (
        <ul className="space-y-3" aria-label="Patients">
          {patients.map((p) => {
            const name = p.medicalId.fullName.trim() || "Unnamed patient";
            const medCount = p.cadence.medications.length;
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/doctor/${p.id}`}
                    className="text-xl font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {name}
                  </Link>
                  <p className="text-muted-foreground">
                    {p.medicalId.dateOfBirth
                      ? `Born ${formatDate(p.medicalId.dateOfBirth)}`
                      : "No date of birth"}
                    {" · "}
                    <CalendarClock className="inline size-4 align-text-bottom" aria-hidden="true" />{" "}
                    {medCount === 0
                      ? "No medicines"
                      : `${medCount} medicine${medCount === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Button nativeButton={false} render={<Link href={`/doctor/${p.id}`} />} variant="secondary" className="min-h-12">
                  Open
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-12 text-destructive"
                  onClick={() => setPendingDelete(p)}
                  aria-label={`Delete ${name}`}
                >
                  <Trash2 aria-hidden="true" /> Delete
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this patient?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.medicalId.fullName || "This patient"} and their medicine
              schedule will be removed from this browser. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-12" onClick={() => setPendingDelete(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              className="min-h-12"
              onClick={() => {
                if (pendingDelete) remove(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
