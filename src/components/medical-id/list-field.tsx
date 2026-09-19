"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  emptyText: string;
};

export function ListField({ label, hint, placeholder, items, onChange, emptyText }: Props) {
  const id = useId();
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    onChange([...items, v]);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-h-12 text-base"
        />
        <Button type="button" variant="secondary" onClick={add} className="min-h-12">
          <Plus aria-hidden="true" /> Add
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-1 rounded-full border bg-secondary py-1 pl-3 pr-1"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${item}`}
                className="flex size-9 items-center justify-center rounded-full hover:bg-background"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
