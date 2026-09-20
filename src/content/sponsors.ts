/**
 * Static sponsor configuration for the ad slots.
 *
 * Privacy rules (enforced by convention, checked by `validateSponsors`):
 * - No scripts, trackers, iframes, or remote assets. Copy is plain text,
 *   icons come from the `lucide-react` set already bundled with the app.
 * - `link` must be a plain `https://` URL — no redirect/tracking domains.
 * - Every sponsor needs both `en-US` and `pt-BR` copy (title + body).
 *
 * To add a sponsor, append an entry to `sponsors` below. Leave the array
 * empty to disable ads entirely — `SponsorSlot` renders nothing and the
 * two-column layout collapses back to a single column when there are no
 * sponsors.
 */
import type { LucideIcon } from 'lucide-react';
import type { Locale } from '../lib/i18n';

export interface SponsorCopy {
  /** Short sponsor name or headline, e.g. "Local Pharmacy Network". */
  title: string;
  /** One or two sentences of sponsor description. */
  body: string;
}

export interface Sponsor {
  /** Stable, unique identifier used for React keys and validation. */
  id: string;
  /** Destination URL. Must be `https://`. Opens in a new tab with `rel="noopener noreferrer nofollow sponsored"`. */
  link: string;
  /** Optional Lucide icon component shown next to the copy. */
  icon?: LucideIcon;
  /** Locale-specific copy. Both `en-US` and `pt-BR` are required. */
  copy: Record<Locale, SponsorCopy>;
}

/**
 * The active sponsor list. Empty by default — fill this in to enable the
 * ad slots. See the README section "Configuring sponsors" for details.
 */
export const sponsors: Sponsor[] = [];

const REQUIRED_LOCALES: Locale[] = ['en-US', 'pt-BR'];

/** Validates a single sponsor entry, returning a list of human-readable errors. */
export function validateSponsor(sponsor: Sponsor): string[] {
  const errors: string[] = [];

  if (!sponsor.id || !sponsor.id.trim()) {
    errors.push('Sponsor is missing an id.');
  }

  if (!/^https:\/\/\S+$/.test(sponsor.link)) {
    errors.push(`Sponsor "${sponsor.id || '(unknown)'}" link must be a plain https:// URL.`);
  }

  for (const locale of REQUIRED_LOCALES) {
    const copy = sponsor.copy?.[locale];
    if (!copy || !copy.title?.trim() || !copy.body?.trim()) {
      errors.push(`Sponsor "${sponsor.id || '(unknown)'}" is missing ${locale} title/body copy.`);
    }
  }

  return errors;
}

/** Validates the full sponsor list, including duplicate id detection. */
export function validateSponsors(list: Sponsor[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const sponsor of list) {
    errors.push(...validateSponsor(sponsor));
    if (sponsor.id) {
      if (seen.has(sponsor.id)) {
        errors.push(`Duplicate sponsor id "${sponsor.id}".`);
      }
      seen.add(sponsor.id);
    }
  }

  return errors;
}
