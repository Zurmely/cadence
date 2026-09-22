import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  /** Visible label next to the box. */
  label: string;
  /** Fuller accessible name, e.g. including the medication and dose. */
  srLabel?: string;
};

export function Checkbox({ checked, onCheckedChange, id, label, srLabel }: Props) {
  return (
    <div className="flex items-center gap-3">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-label={srLabel ?? label}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-cadence-text bg-cadence-surface transition-colors hover:bg-cadence-surface-alt data-[state=checked]:border-cadence-primary data-[state=checked]:bg-cadence-primary"
      >
        <RadixCheckbox.Indicator>
          <Check className="size-6 text-white" aria-hidden="true" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="cursor-pointer font-semibold text-cadence-text">
        {label}
      </label>
    </div>
  );
}
