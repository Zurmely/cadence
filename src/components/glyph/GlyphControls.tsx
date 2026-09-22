import { useId, useState } from 'react';
import { MEDICATION_FORMS, type MedicationForm } from '../../lib/profile/schema';
import type { MedicationGlyphParams } from '../../lib/profile/schema';
import { t, type Locale } from '../../lib/i18n';
import { MedicationGlyph } from './MedicationGlyph';
import { SCORING_STYLES, scoringToStyle, styleToScoring, type ScoringStyle } from './geometry';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

const SWATCHES = [
  { key: 'blue', hex: '#0b5fa8' },
  { key: 'red', hex: '#b3261e' },
  { key: 'green', hex: '#146c43' },
  { key: 'purple', hex: '#6b3fa0' },
  { key: 'orange', hex: '#c25a00' },
  { key: 'teal', hex: '#0e7c86' },
  { key: 'yellow', hex: '#c79a00' },
  { key: 'gray', hex: '#5b6472' },
  { key: 'black', hex: '#10151a' },
  { key: 'white', hex: '#ffffff' },
] as const satisfies { key: MessageKeyLeaf; hex: string }[];

type MessageKeyLeaf =
  | 'blue'
  | 'red'
  | 'green'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'yellow'
  | 'gray'
  | 'black'
  | 'white';

type Props = {
  value: MedicationGlyphParams;
  onChange: (next: MedicationGlyphParams) => void;
  locale: Locale;
};

const selectRing =
  'ring-2 ring-cadence-primary ring-offset-2 ring-offset-cadence-surface border-cadence-primary';
const idleRing = 'border-cadence-border';

export function GlyphControls({ value, onChange, locale }: Props) {
  const scoringGroupId = useId();

  const setField = <K extends keyof MedicationGlyphParams>(
    key: K,
    fieldValue: MedicationGlyphParams[K],
  ) => onChange({ ...value, [key]: fieldValue });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <MedicationGlyph {...value} size={56} label={t(locale, 'glyph.preview')} />
        <p className="text-cadence-muted">{t(locale, 'glyph.preview')}</p>
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">{t(locale, 'glyph.formLabel')}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {MEDICATION_FORMS.map((form) => (
            <FormThumbnail
              key={form}
              form={form}
              locale={locale}
              selected={value.form === form}
              glyphParams={value}
              onSelect={() => setField('form', form)}
            />
          ))}
        </div>
      </fieldset>

      <ColorField
        label={t(locale, 'glyph.primaryColor')}
        value={value.primaryColor}
        onChange={(hex) => setField('primaryColor', hex)}
        locale={locale}
      />
      <ColorField
        label={t(locale, 'glyph.secondaryColor')}
        value={value.secondaryColor}
        onChange={(hex) => setField('secondaryColor', hex)}
        locale={locale}
      />

      <fieldset>
        <legend className="mb-2 font-semibold">{t(locale, 'glyph.scoringLabel')}</legend>
        <div className="flex flex-wrap gap-2" id={scoringGroupId}>
          {SCORING_STYLES.map((style) => (
            <ScoringButton
              key={style}
              style={style}
              locale={locale}
              selected={scoringToStyle(value.scoring) === style}
              onSelect={() => setField('scoring', styleToScoring(style))}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function FormThumbnail({
  form,
  locale,
  selected,
  glyphParams,
  onSelect,
}: {
  form: MedicationForm;
  locale: Locale;
  selected: boolean;
  glyphParams: MedicationGlyphParams;
  onSelect: () => void;
}) {
  const label = t(locale, `glyph.form.${form}` as const);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-11 flex-col items-center gap-1 rounded-md border-2 bg-white p-2 text-center ${
        selected ? selectRing : idleRing
      }`}
    >
      <MedicationGlyph {...glyphParams} form={form} size={32} label={label} />
      <span className="text-sm leading-tight">{label}</span>
    </button>
  );
}

function ScoringButton({
  style,
  locale,
  selected,
  onSelect,
}: {
  style: ScoringStyle;
  locale: Locale;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`min-h-11 rounded-md border-2 bg-white px-3 font-semibold ${
        selected ? selectRing : idleRing
      }`}
    >
      {t(locale, `glyph.scoring.${style}` as const)}
    </button>
  );
}

function ColorField({
  label,
  value,
  onChange,
  locale,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  locale: Locale;
}) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const fieldId = useId();
  const errorId = useId();

  const commit = (candidate: string) => {
    setDraft(candidate);
    if (HEX_PATTERN.test(candidate)) {
      setInvalid(false);
      onChange(candidate.startsWith('#') ? candidate : `#${candidate}`);
    } else {
      setInvalid(true);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {SWATCHES.map((swatch) => {
          const swatchLabel = t(locale, `glyph.colorNames.${swatch.key}` as const);
          const selected = value.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.key}
              type="button"
              aria-label={swatchLabel}
              aria-pressed={selected}
              title={swatchLabel}
              onClick={() => {
                setDraft(swatch.hex);
                setInvalid(false);
                onChange(swatch.hex);
              }}
              className={`size-9 rounded-full border-2 ${selected ? selectRing : idleRing}`}
              style={{ backgroundColor: swatch.hex }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={fieldId} className="sr-only">
          {t(locale, 'glyph.hexInputLabel')}
        </label>
        <input
          id={fieldId}
          type="color"
          value={HEX_PATTERN.test(value) ? value : '#000000'}
          onChange={(event) => commit(event.target.value)}
          className="size-11 cursor-pointer rounded-lg border-2 border-cadence-border p-0"
          aria-label={t(locale, 'glyph.hexInputLabel')}
        />
        <input
          type="text"
          inputMode="text"
          value={draft}
          placeholder="#1a73e8"
          onChange={(event) => commit(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className="cadence-input w-32 font-mono"
        />
      </div>
      {invalid ? (
        <p id={errorId} className="text-cadence-danger" role="alert">
          {t(locale, 'glyph.hexInvalid')}
        </p>
      ) : null}
    </fieldset>
  );
}
