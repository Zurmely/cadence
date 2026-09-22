import { useEffect, useId, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import QRCode from 'qrcode';
import { AlertTriangle, Check, Copy, X } from 'lucide-react';
import { encodeProfileToHash, type Profile } from '../../lib/profile';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { Switch } from '../ui/Switch';

type Props = {
  profile: Profile;
  /** Page the QR/link points at. Defaults to the emergency view. */
  path?: string;
  className?: string;
};

/** Renders a `qrcode`-generated bit matrix as a crisp, currentColor-friendly SVG. */
function QrCodeSvg({ value, label, size = 208 }: { value: string; label: string; size?: number }) {
  const cellPath = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      let path = '';
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.modules.get(row, col)) {
            path += `M${col},${row}h1v1h-1z`;
          }
        }
      }
      return { path, count };
    } catch {
      return null;
    }
  }, [value]);

  if (!cellPath) return null;

  return (
    <svg
      viewBox={`0 0 ${cellPath.count} ${cellPath.count}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className="rounded-md border-2 border-cadence-border bg-white p-2"
    >
      <rect width={cellPath.count} height={cellPath.count} fill="#ffffff" />
      <path d={cellPath.path} fill="#000000" shapeRendering="crispEdges" />
    </svg>
  );
}

export function QrShare({ profile, path = '/emergency', className }: Props) {
  const [locale] = useLocale();
  const toggleId = useId();
  const [emergencyOnly, setEmergencyOnly] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = useMemo(() => {
    if (!origin) return '';
    const hash = encodeProfileToHash(profile, { emergencyOnly });
    return `${origin}${path}${hash}`;
  }, [origin, path, profile, emergencyOnly]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t(locale, 'share.copied'));
    } catch {
      setStatus(t(locale, 'share.copyFailed'));
    }
  };

  const requestSwitchToFull = () => setConfirmOpen(true);
  const confirmFull = () => {
    setEmergencyOnly(false);
    setConfirmOpen(false);
    setStatus('');
  };

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`}>
      <div
        className="flex items-start gap-3 rounded-lg border-2 border-cadence-danger bg-white p-3"
        role="note"
      >
        <AlertTriangle className="mt-0.5 size-6 shrink-0 text-cadence-danger" aria-hidden="true" />
        <p className="font-semibold text-cadence-text">{t(locale, 'share.healthDataWarning')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Switch
          id={toggleId}
          checked={emergencyOnly}
          onCheckedChange={(checked) => (checked ? setEmergencyOnly(true) : requestSwitchToFull())}
          label={t(locale, 'share.emergencyOnlyToggle')}
          description={
            emergencyOnly ? t(locale, 'share.emergencyOnlyHint') : t(locale, 'share.fullPayloadHint')
          }
        />
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <QrCodeSvg
          value={url}
          label={
            emergencyOnly ? t(locale, 'share.qrAltEmergency') : t(locale, 'share.qrAltFull')
          }
        />
        <div className="flex flex-1 flex-col gap-2">
          <p className="break-all rounded-md border-2 border-cadence-border bg-cadence-bg px-3 py-2 text-sm text-cadence-muted">
            {url || t(locale, 'share.linkPending')}
          </p>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cadence-primary px-4 font-semibold text-cadence-primary-contrast disabled:opacity-60"
            onClick={copyLink}
            disabled={!url}
          >
            <Copy className="size-5" aria-hidden="true" />
            {t(locale, 'share.copyLink')}
          </button>
          <p className="text-cadence-success" aria-live="polite">
            {status || '\u00a0'}
          </p>
        </div>
      </div>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-cadence-danger bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="flex items-center gap-2 text-2xl font-bold text-cadence-text">
                <AlertTriangle className="size-6 text-cadence-danger" aria-hidden="true" />
                {t(locale, 'share.confirmFullTitle')}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t(locale, 'share.confirmCancel')}
                className="rounded-md p-1 text-cadence-muted hover:text-cadence-text"
              >
                <X className="size-6" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-3 text-cadence-text">
              {t(locale, 'share.confirmFullBody')}
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close className="min-h-11 rounded-md border-2 border-cadence-border px-4 font-semibold text-cadence-text">
                {t(locale, 'share.confirmCancel')}
              </Dialog.Close>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-cadence-danger px-4 font-semibold text-cadence-danger-contrast"
                onClick={confirmFull}
              >
                <Check className="size-5" aria-hidden="true" />
                {t(locale, 'share.confirmFullAction')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
