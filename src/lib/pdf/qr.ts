import QRCode from 'qrcode';
import { encodeProfileToHash, type Profile } from '../profile';

/** Renders a QR code to a PNG data URL. Works in both the browser and Node. */
export async function qrCodeDataUrl(text: string, sizePx = 256): Promise<string> {
  return QRCode.toDataURL(text, {
    width: sizePx,
    margin: 1,
    color: { dark: '#10151a', light: '#ffffff' },
  });
}

/**
 * Builds the emergency-only share URL for a profile and renders it as a QR
 * PNG data URL, ready for `jsPDF#addImage`.
 */
export async function emergencyQrCodeDataUrl(
  profile: Profile,
  siteOrigin: string,
  sizePx = 256,
): Promise<{ url: string; dataUrl: string }> {
  const hash = encodeProfileToHash(profile, { emergencyOnly: true });
  const url = `${siteOrigin.replace(/\/$/, '')}/emergency${hash}`;
  const dataUrl = await qrCodeDataUrl(url, sizePx);
  return { url, dataUrl };
}
