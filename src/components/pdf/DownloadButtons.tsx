import { useState } from 'react';
import { Download, Loader2, TriangleAlert } from 'lucide-react';
import { t, type Locale } from '../../lib/i18n';
import type { Profile } from '../../lib/profile';
import { generateDailyIntakePdf } from '../../lib/pdf/dailyIntake';
import { generateWalletCardPdf } from '../../lib/pdf/walletCard';
import type { PageFormat } from '../../lib/pdf/layout';

type ButtonKey = 'wallet' | 'daily-a4' | 'daily-letter';
type ButtonState = 'idle' | 'loading' | 'error';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DownloadButton({
  label,
  state,
  onClick,
  variant = 'primary',
}: {
  label: string;
  state: ButtonState;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const style = variant === 'primary' ? 'cadence-btn cadence-btn-primary' : 'cadence-btn cadence-btn-outline';

  return (
    <button type="button" className={style} onClick={onClick} disabled={state === 'loading'}>
      {state === 'loading' ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-5" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}

/**
 * Client-side jsPDF download buttons for Template A (wallet card) and
 * Template B (daily intake, A4 + Letter). Nothing leaves the device — the
 * PDF is generated in memory and downloaded via a Blob URL.
 */
export function DownloadButtons({ profile, locale }: { profile: Profile; locale: Locale }) {
  const [states, setStates] = useState<Record<ButtonKey, ButtonState>>({
    wallet: 'idle',
    'daily-a4': 'idle',
    'daily-letter': 'idle',
  });

  const setState = (key: ButtonKey, state: ButtonState) =>
    setStates((prev) => ({ ...prev, [key]: state }));

  const downloadWalletCard = async () => {
    setState('wallet', 'loading');
    try {
      const doc = await generateWalletCardPdf(profile, {
        siteOrigin: window.location.origin,
        locale,
      });
      triggerDownload(doc.output('blob'), 'cadence-emergency-wallet-card.pdf');
      setState('wallet', 'idle');
    } catch {
      setState('wallet', 'error');
    }
  };

  const downloadDailyIntake = async (format: PageFormat) => {
    const key: ButtonKey = format === 'a4' ? 'daily-a4' : 'daily-letter';
    setState(key, 'loading');
    try {
      const doc = await generateDailyIntakePdf(profile, { locale, format });
      triggerDownload(doc.output('blob'), `cadence-daily-intake-${format}.pdf`);
      setState(key, 'idle');
    } catch {
      setState(key, 'error');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="cadence-card p-6 sm:p-7">
        <h2 className="text-2xl">{t(locale, 'pdf.walletCard.heading')}</h2>
        <p className="mt-2 text-cadence-muted">{t(locale, 'pdf.walletCard.description')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DownloadButton
            label={
              states.wallet === 'loading'
                ? t(locale, 'pdf.walletCard.generating')
                : t(locale, 'pdf.walletCard.download')
            }
            state={states.wallet}
            onClick={downloadWalletCard}
          />
        </div>
        {states.wallet === 'error' ? (
          <p className="mt-3 flex items-center gap-2 font-semibold text-cadence-danger" role="alert">
            <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
            {t(locale, 'pdf.walletCard.error')}
          </p>
        ) : null}
      </section>

      <section className="cadence-card p-6 sm:p-7">
        <h2 className="text-2xl">{t(locale, 'pdf.dailyIntake.heading')}</h2>
        <p className="mt-2 text-cadence-muted">{t(locale, 'pdf.dailyIntake.description')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DownloadButton
            label={
              states['daily-a4'] === 'loading'
                ? t(locale, 'pdf.dailyIntake.generating')
                : t(locale, 'pdf.dailyIntake.downloadA4')
            }
            state={states['daily-a4']}
            onClick={() => downloadDailyIntake('a4')}
          />
          <DownloadButton
            label={
              states['daily-letter'] === 'loading'
                ? t(locale, 'pdf.dailyIntake.generating')
                : t(locale, 'pdf.dailyIntake.downloadLetter')
            }
            state={states['daily-letter']}
            onClick={() => downloadDailyIntake('letter')}
            variant="secondary"
          />
        </div>
        {states['daily-a4'] === 'error' || states['daily-letter'] === 'error' ? (
          <p className="mt-3 flex items-center gap-2 font-semibold text-cadence-danger" role="alert">
            <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
            {t(locale, 'pdf.dailyIntake.error')}
          </p>
        ) : null}
      </section>
    </div>
  );
}
