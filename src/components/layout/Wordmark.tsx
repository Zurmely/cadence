import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';

/**
 * Brand: a serif wordmark next to a tiny heartbeat trace drawn inline so it
 * scales with the type and inherits the current text color.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  const [locale] = useLocale();
  return (
    <a href="/" className="inline-flex w-fit items-center gap-2.5 text-cadence-text">
      <svg
        viewBox="0 0 40 20"
        className={compact ? 'h-4 w-8' : 'h-5 w-10'}
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12h8l3-8 5 15 4-11 3 4h15" className="text-cadence-primary" />
      </svg>
      <span
        className={`font-display font-semibold tracking-tight ${compact ? 'text-xl' : 'text-[1.6rem]'}`}
      >
        {t(locale, 'nav.brand')}
      </span>
    </a>
  );
}
