import { Activity } from 'lucide-react';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { LanguageToggle } from './LanguageToggle';

type Props = {
  currentPath: string;
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export function Nav({ currentPath }: Props) {
  const [locale] = useLocale();
  const path = normalizePath(currentPath);

  const links = [
    { href: '/', key: 'nav.home' as const },
    { href: '/schedule', key: 'nav.schedule' as const },
    { href: '/emergency', key: 'nav.emergency' as const },
    { href: '/print', key: 'nav.print' as const },
  ];

  return (
    <>
      <a className="cadence-skip-link" href="#main">
        {t(locale, 'nav.skip')}
      </a>
      <header className="border-b-2 border-cadence-border bg-cadence-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <a href="/" className="flex items-center gap-2 text-cadence-primary-dark">
          <Activity className="size-7" aria-hidden="true" />
          <span className="text-2xl font-bold tracking-tight">{t(locale, 'nav.brand')}</span>
        </a>
        <nav aria-label={t(locale, 'nav.brand')} className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = path === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-2 font-semibold ${
                  active
                    ? 'bg-cadence-primary text-cadence-primary-contrast'
                    : 'text-cadence-primary-dark underline-offset-4 hover:underline'
                }`}
              >
                {t(locale, link.key)}
              </a>
            );
          })}
          <LanguageToggle />
        </nav>
      </div>
    </header>
    </>
  );
}
