import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { sponsors, type Sponsor } from '../../content/sponsors';

export type SponsorSlotVariant = 'sidebar' | 'inline';

interface SponsorSlotProps {
  /** `sidebar` — desktop secondary sidebar card. `inline` — mobile card in the content flow. */
  variant: SponsorSlotVariant;
  className?: string;
}

function pickSponsor(): Sponsor | undefined {
  return sponsors[0];
}

/**
 * Static sponsor card. Renders nothing when `src/content/sponsors.ts` has no
 * entries, so the surrounding two-column layout collapses cleanly.
 *
 * No scripts, iframes, trackers, or remote assets — copy and icon only.
 */
export function SponsorSlot({ variant, className = '' }: SponsorSlotProps) {
  const [locale] = useLocale();
  const sponsor = pickSponsor();

  if (!sponsor) return null;

  const copy = sponsor.copy[locale];
  const Icon = sponsor.icon;

  const paddingClass = variant === 'sidebar' ? 'p-5' : 'p-4';

  return (
    <aside
      aria-label={t(locale, 'ads.label')}
      data-sponsor-slot={variant}
      className={`cadence-card flex flex-col gap-3 ${paddingClass} ${className}`.trim()}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-cadence-muted">
        {t(locale, 'ads.label')}
      </p>

      <div className="flex items-start gap-3">
        {Icon ? (
          <Icon
            className="mt-0.5 h-6 w-6 flex-shrink-0 text-cadence-primary"
            aria-hidden="true"
          />
        ) : null}
        <div>
          <h3 className="text-lg font-semibold">{copy.title}</h3>
          <p className="mt-1 text-cadence-muted">{copy.body}</p>
        </div>
      </div>

      <a
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="inline-flex min-h-11 items-center font-semibold text-cadence-primary underline underline-offset-2"
      >
        {t(locale, 'ads.cta')}
        <span className="sr-only"> — {copy.title}</span>
      </a>

      <p className="text-xs text-cadence-muted">{t(locale, 'ads.disclosure')}</p>
    </aside>
  );
}
