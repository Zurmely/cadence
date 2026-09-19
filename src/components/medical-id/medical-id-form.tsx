"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListField } from "./list-field";
import {
  BLOOD_TYPES,
  newId,
  type BloodType,
  type EmergencyContact,
  type MedicalId,
} from "@/lib/types";

type Props = {
  value: MedicalId;
  onChange: (next: MedicalId) => void;
};

const fieldClass = "min-h-12 text-base";

export function MedicalIdForm({ value, onChange }: Props) {
  const set = <K extends keyof MedicalId>(key: K, v: MedicalId[K]) =>
    onChange({ ...value, [key]: v });

  const setContact = (id: string, patch: Partial<EmergencyContact>) =>
    set(
      "emergencyContacts",
      value.emergencyContacts.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );

  const nameMissing = value.fullName.trim() === "";

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()} noValidate>
      <fieldset className="space-y-4">
        <legend className="mb-2 text-xl font-bold">About you</legend>
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-base">
            Full name <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="fullName"
            required
            autoComplete="name"
            value={value.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={nameMissing}
            aria-describedby="fullName-help"
            className={fieldClass}
          />
          <p id="fullName-help" className="text-muted-foreground">
            {nameMissing
              ? "A name is needed before the card can be printed."
              : "Shown in large letters at the top of the card."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-base">
              Date of birth
            </Label>
            <Input
              id="dob"
              type="date"
              autoComplete="bday"
              value={value.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodType" className="text-base">
              Blood type
            </Label>
            <Select
              value={value.bloodType}
              onValueChange={(v) => v && set("bloodType", v as BloodType)}
            >
              <SelectTrigger id="bloodType" className={`w-full ${fieldClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-base">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="mb-2 text-xl font-bold">Medical information</legend>
        <ListField
          label="Allergies"
          hint="Type one allergy and press Add. Include drug, food and latex allergies."
          placeholder="e.g. Penicillin"
          items={value.allergies}
          onChange={(v) => set("allergies", v)}
          emptyText="No allergies added. The card will say “No known allergies”."
        />
        <ListField
          label="Medical conditions"
          placeholder="e.g. Type 2 diabetes"
          items={value.conditions}
          onChange={(v) => set("conditions", v)}
          emptyText="No conditions added yet."
        />
        <ListField
          label="Current medications"
          hint="Name and dose is enough, e.g. “Metformin 500 mg”."
          placeholder="e.g. Metformin 500 mg"
          items={value.medications}
          onChange={(v) => set("medications", v)}
          emptyText="No medications added yet."
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-xl font-bold">Emergency contacts</legend>
        {value.emergencyContacts.length === 0 && (
          <p className="text-muted-foreground">
            Add at least one person who can be called in an emergency.
          </p>
        )}
        <ul className="space-y-4">
          {value.emergencyContacts.map((c, i) => (
            <li key={c.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Contact {i + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    set(
                      "emergencyContacts",
                      value.emergencyContacts.filter((x) => x.id !== c.id)
                    )
                  }
                  className="min-h-11 text-destructive"
                >
                  <Trash2 aria-hidden="true" /> Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor={`c-name-${c.id}`}>Name</Label>
                  <Input
                    id={`c-name-${c.id}`}
                    value={c.name}
                    onChange={(e) => setContact(c.id, { name: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`c-rel-${c.id}`}>Relationship</Label>
                  <Input
                    id={`c-rel-${c.id}`}
                    placeholder="e.g. Daughter"
                    value={c.relationship}
                    onChange={(e) => setContact(c.id, { relationship: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`c-phone-${c.id}`}>Phone</Label>
                  <Input
                    id={`c-phone-${c.id}`}
                    type="tel"
                    autoComplete="tel"
                    value={c.phone}
                    onChange={(e) => setContact(c.id, { phone: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12"
          onClick={() =>
            set("emergencyContacts", [
              ...value.emergencyContacts,
              { id: newId(), name: "", relationship: "", phone: "" },
            ])
          }
        >
          <Plus aria-hidden="true" /> Add contact
        </Button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-xl font-bold">Doctor and notes</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doctorName" className="text-base">
              Doctor or clinic
            </Label>
            <Input
              id="doctorName"
              value={value.doctorName}
              onChange={(e) => set("doctorName", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctorPhone" className="text-base">
              Doctor phone
            </Label>
            <Input
              id="doctorPhone"
              type="tel"
              value={value.doctorPhone}
              onChange={(e) => set("doctorPhone", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base">
            Other notes
          </Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="e.g. Pacemaker fitted. Hard of hearing — please speak clearly."
            value={value.notes}
            onChange={(e) => set("notes", e.target.value)}
            aria-describedby="notes-help"
            className="text-base"
          />
          <p id="notes-help" className="text-muted-foreground">
            Implants, organ donor status, language, or anything a paramedic should know.
          </p>
        </div>
      </fieldset>
    </form>
  );
}
