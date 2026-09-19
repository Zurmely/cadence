import { Moon, Sun, Sunrise, Sunset, Utensils, UtensilsCrossed, type LucideProps } from "lucide-react";
import type { FoodRule, TimeSlot } from "@/lib/types";

const ICONS: Record<TimeSlot, React.ComponentType<LucideProps>> = {
  morning: Sunrise,
  noon: Sun,
  evening: Sunset,
  night: Moon,
};

export function TimeSlotIcon({ slot, ...props }: { slot: TimeSlot } & LucideProps) {
  const Icon = ICONS[slot];
  return <Icon aria-hidden="true" {...props} />;
}

export const FOOD_LABELS: Record<FoodRule, string> = {
  with: "Take with food",
  without: "Take on an empty stomach",
  either: "With or without food",
};

export function FoodIcon({ rule, ...props }: { rule: FoodRule } & LucideProps) {
  if (rule === "without") return <UtensilsCrossed aria-hidden="true" {...props} />;
  return <Utensils aria-hidden="true" {...props} />;
}
