"use client";

import { useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PillSvg } from "./pill-svg";
import { FOOD_LABELS, FoodIcon, TimeSlotIcon } from "./time-icons";
import {
  newMedication,
  PILL_COLORS,
  PILL_SHAPES,
  SLOT_LABELS,
  TIME_SLOTS,
  WEEKDAYS,
  type Cadence,
  type FoodRule,
  type Medication,
  type PillShape,
  type TimeSlot,
  type Weekday,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 300 * 1024;

type Props = { value: Cadence; onChange: (next: Cadence) => void };

export function CadenceForm({ value, onChange }: Props) {
  const setMed = (id: string, patch: Partial<Medication>) =>
    onChange({
      ...value,
      medications: value.medications.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()} noValidate>
      <fieldset>
        <legend className="mb-2 text-xl font-bold">Times of day</legend>
        <p className="mb-3 text-muted-foreground">
          Set the usual time for each part of the day. These show on the schedule.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="space-y-1">
              <Label htmlFor={`slot-${slot}`} className="flex items-center gap-1.5">
                <TimeSlotIcon slot={slot} className="size-5 text-primary" />
                {SLOT_LABELS[slot]}
              </Label>
              <Input
                id={`slot-${slot}`}
                type="time"
                value={value.slotTimes[slot]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    slotTimes: { ...value.slotTimes, [slot]: e.target.value },
                  })
                }
                className="min-h-12 text-base"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-xl font-bold">Medicines</legend>
        {value.medications.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            No medicines yet. Add one to start building the schedule.
          </p>
        )}
        <ul className="space-y-6">
          {value.medications.map((med, i) => (
            <li key={med.id}>
              <MedicationEditor
                index={i}
                med={med}
                onChange={(patch) => setMed(med.id, patch)}
                onRemove={() =>
                  onChange({
                    ...value,
                    medications: value.medications.filter((m) => m.id !== med.id),
                  })
                }
              />
            </li>
          ))}
        </ul>
        <Button
          type="button"
          className="min-h-12"
          onClick={() =>
            onChange({ ...value, medications: [...value.medications, newMedication()] })
          }
        >
          <Plus aria-hidden="true" /> Add medicine
        </Button>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="general" className="text-xl font-bold">
          General advice
        </Label>
        <Textarea
          id="general"
          rows={3}
          placeholder="e.g. If you miss a dose, take it when you remember unless the next one is due soon. Never take two at once."
          value={value.generalInstructions}
          onChange={(e) => onChange({ ...value, generalInstructions: e.target.value })}
          className="text-base"
        />
      </div>
    </form>
  );
}

function MedicationEditor({
  index,
  med,
  onChange,
  onRemove,
}: {
  index: number;
  med: Medication;
  onChange: (patch: Partial<Medication>) => void;
  onRemove: () => void;
}) {
  const [imageError, setImageError] = useState<string | null>(null);
  const p = `med-${med.id}`;

  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const onImage = (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Photo is too large. Please use one under 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ imageDataUrl: String(reader.result) });
    reader.onerror = () => setImageError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PillSvg med={med} size={56} />
          <h3 className="text-lg font-bold">
            {med.name || `Medicine ${index + 1}`}
          </h3>
        </div>
        <Button type="button" variant="ghost" onClick={onRemove} className="min-h-11 text-destructive">
          <Trash2 aria-hidden="true" /> Remove
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${p}-name`}>Medicine name</Label>
          <Input
            id={`${p}-name`}
            value={med.name}
            placeholder="e.g. Metformin"
            onChange={(e) => onChange({ name: e.target.value })}
            className="min-h-12 text-base"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${p}-dose`}>Dose</Label>
          <Input
            id={`${p}-dose`}
            value={med.dose}
            placeholder="e.g. 1 tablet (500 mg)"
            onChange={(e) => onChange({ dose: e.target.value })}
            className="min-h-12 text-base"
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 font-bold">What the pill looks like</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor={`${p}-shape`}>Shape</Label>
            <Select value={med.shape} onValueChange={(v) => v && onChange({ shape: v as PillShape })}>
              <SelectTrigger id={`${p}-shape`} className="min-h-12 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILL_SHAPES.map((s) => (
                  <SelectItem key={s} value={s} className="text-base capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${p}-color`}>Colour</Label>
            <Select value={med.color} onValueChange={(v) => v && onChange({ color: v })}>
              <SelectTrigger id={`${p}-color`} className="min-h-12 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILL_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-base">
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block size-4 rounded-full border"
                      style={{ background: c.value }}
                    />
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {med.shape === "capsule" && (
            <div className="space-y-1">
              <Label htmlFor={`${p}-color2`}>Second colour</Label>
              <Select
                value={med.secondaryColor ?? med.color}
                onValueChange={(v) => v && onChange({ secondaryColor: v })}
              >
                <SelectTrigger id={`${p}-color2`} className="min-h-12 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILL_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-base">
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block size-4 rounded-full border"
                        style={{ background: c.value }}
                      />
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor={`${p}-marking`}>Marking (letters or numbers on the pill)</Label>
            <Input
              id={`${p}-marking`}
              value={med.marking}
              maxLength={6}
              placeholder="e.g. M 500"
              onChange={(e) => onChange({ marking: e.target.value })}
              className="min-h-12 text-base"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Label
            htmlFor={`${p}-image`}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 font-medium hover:bg-secondary"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            {med.imageDataUrl ? "Change photo" : "Add a photo instead (optional)"}
          </Label>
          <input
            id={`${p}-image`}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onImage(e.target.files?.[0])}
          />
          {med.imageDataUrl && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => onChange({ imageDataUrl: undefined })}
            >
              <X aria-hidden="true" /> Remove photo
            </Button>
          )}
          {imageError && (
            <p role="alert" className="text-destructive">
              {imageError}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 font-bold">When to take it</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIME_SLOTS.map((slot) => {
            const checked = med.slots.includes(slot);
            return (
              <label
                key={slot}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 has-focus-visible:ring-3 has-focus-visible:ring-ring",
                  checked ? "border-primary bg-secondary" : "border-border"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onChange({ slots: toggle<TimeSlot>(med.slots, slot) })}
                />
                <TimeSlotIcon slot={slot} className="size-5 text-primary" />
                <span>{SLOT_LABELS[slot]}</span>
              </label>
            );
          })}
        </div>
        {med.slots.length === 0 && (
          <p className="mt-2 text-destructive">Choose at least one time of day.</p>
        )}
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 font-bold">Which days</legend>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={med.days.length === WEEKDAYS.length ? "default" : "outline"}
            className="min-h-11"
            onClick={() => onChange({ days: [...WEEKDAYS] })}
          >
            Every day
          </Button>
          {WEEKDAYS.map((d) => {
            const on = med.days.includes(d);
            return (
              <Button
                key={d}
                type="button"
                variant={on ? "secondary" : "outline"}
                aria-pressed={on}
                className={cn("min-h-11 min-w-14", on && "border-primary")}
                onClick={() => onChange({ days: toggle<Weekday>(med.days, d) })}
              >
                {d}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 font-bold">Food</legend>
        <RadioGroup
          value={med.food}
          onValueChange={(v) => v && onChange({ food: v as FoodRule })}
          className="grid gap-2 sm:grid-cols-3"
        >
          {(Object.keys(FOOD_LABELS) as FoodRule[]).map((rule) => (
            <label
              key={rule}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 has-focus-visible:ring-3 has-focus-visible:ring-ring",
                med.food === rule ? "border-primary bg-secondary" : "border-border"
              )}
            >
              <RadioGroupItem value={rule} />
              <FoodIcon rule={rule} className="size-5 text-primary" />
              <span>{FOOD_LABELS[rule]}</span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="mt-4 space-y-1">
        <Label htmlFor={`${p}-instr`}>Plain-language instructions</Label>
        <Textarea
          id={`${p}-instr`}
          rows={2}
          value={med.instructions}
          placeholder="e.g. Swallow whole with a full glass of water. Do not crush."
          onChange={(e) => onChange({ instructions: e.target.value })}
          className="text-base"
        />
      </div>
      <p className="mt-2 text-muted-foreground">
        Will show at:{" "}
        {med.slots.length
          ? med.slots.map((s) => SLOT_LABELS[s]).join(", ")
          : "— not scheduled —"}
      </p>
    </div>
  );
}
