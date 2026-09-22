import * as RadixSwitch from '@radix-ui/react-switch';

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label: string;
  description?: string;
};

export function Switch({ checked, onCheckedChange, id, label, description }: Props) {
  return (
    <div className="flex items-start gap-3">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-cadence-text bg-cadence-border transition-colors data-[state=checked]:border-cadence-primary-dark data-[state=checked]:bg-cadence-primary"
        aria-describedby={description ? `${id}-hint` : undefined}
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
      </RadixSwitch.Root>
      <div>
        <label htmlFor={id} className="font-semibold text-cadence-text">
          {label}
        </label>
        {description ? (
          <p id={`${id}-hint`} className="mt-1 text-cadence-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
