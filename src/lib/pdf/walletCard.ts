import { jsPDF } from 'jspdf';
import type { Locale } from '../i18n';
import { t } from '../i18n';
import type { Profile } from '../profile';
import { CARD_HEIGHT_IN, CARD_WIDTH_IN, PDF_COLORS, createPanelContext, drawDashedLine } from './layout';
import { emergencyQrCodeDataUrl } from './qr';

const MARGIN_IN = 0.16;
const PAD_IN = 0.14;

export type WalletCardOptions = {
  /** Origin used to build the emergency QR link, e.g. `window.location.origin`. */
  siteOrigin: string;
  locale: Locale;
};

function setInk(doc: jsPDF): void {
  doc.setTextColor(...PDF_COLORS.ink);
}

function drawFrontPanel(doc: jsPDF, profile: Profile, locale: Locale, panelX: number, panelY: number): void {
  const panel = createPanelContext(doc, panelX, panelY, CARD_WIDTH_IN, CARD_HEIGHT_IN, false);
  const w = CARD_WIDTH_IN;

  panel.rect(0, 0, CARD_WIDTH_IN, CARD_HEIGHT_IN, undefined);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.primary);
  panel.text(t(locale, 'pdf.walletCard.eyebrow').toUpperCase(), PAD_IN, PAD_IN + 0.02);

  const bloodLabel =
    profile.person.bloodType === 'unknown' ? t(locale, 'profile.bloodUnknown') : profile.person.bloodType;
  const badgeW = 0.55;
  const badgeH = 0.34;
  const badgeX = w - PAD_IN - badgeW;
  const badgeY = PAD_IN - 0.03;
  doc.setFillColor(...PDF_COLORS.danger);
  panel.roundedRect(badgeX, badgeY, badgeW, badgeH, 0.06, 0.06, 'F');
  doc.setTextColor(...PDF_COLORS.dangerContrast);
  doc.setFontSize(bloodLabel.length > 3 ? 8 : 11);
  panel.text(bloodLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.06, { align: 'center' });

  setInk(doc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const name = profile.person.fullName || t(locale, 'pdf.walletCard.namePlaceholder');
  panel.text(doc.splitTextToSize(name, w - PAD_IN * 2 - badgeW - 0.1)[0] ?? name, PAD_IN, PAD_IN + 0.24);

  doc.setDrawColor(...PDF_COLORS.border);
  panel.line(PAD_IN, 0.46, w - PAD_IN, 0.46);

  let y = 0.62;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...PDF_COLORS.muted);
  panel.text(t(locale, 'pdf.walletCard.conditions').toUpperCase(), PAD_IN, y);
  y += 0.14;

  setInk(doc);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const conditionLines =
    profile.conditions.length > 0
      ? profile.conditions.slice(0, 3).map((c) => `• ${c.name}${c.icd10 ? ` (${c.icd10})` : ''}`)
      : [t(locale, 'pdf.walletCard.none')];
  for (const line of conditionLines.slice(0, 3)) {
    const wrapped = doc.splitTextToSize(line, w - PAD_IN * 2);
    panel.text(wrapped[0] ?? line, PAD_IN, y);
    y += 0.13;
  }

  const badgeBottomY = CARD_HEIGHT_IN - PAD_IN - 0.02;
  const allergyBadgeH = 0.42;
  const allergyBadgeY = badgeBottomY - allergyBadgeH;
  doc.setFillColor(...PDF_COLORS.danger);
  panel.roundedRect(PAD_IN, allergyBadgeY, w - PAD_IN * 2, allergyBadgeH, 0.05, 0.05, 'F');
  doc.setTextColor(...PDF_COLORS.dangerContrast);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  panel.text(t(locale, 'pdf.walletCard.allergies').toUpperCase(), PAD_IN + 0.08, allergyBadgeY + 0.14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const allergyText =
    profile.allergies.length > 0
      ? profile.allergies.map((a) => a.name).join(', ')
      : t(locale, 'pdf.walletCard.noAllergies');
  const allergyLines = doc.splitTextToSize(allergyText, w - PAD_IN * 2 - 0.16);
  panel.text(allergyLines.slice(0, 1), PAD_IN + 0.08, allergyBadgeY + 0.3);
}

function drawBackPanel(
  doc: jsPDF,
  profile: Profile,
  locale: Locale,
  qrDataUrl: string,
  panelX: number,
  panelY: number,
): void {
  const panel = createPanelContext(doc, panelX, panelY, CARD_WIDTH_IN, CARD_HEIGHT_IN, true);
  const w = CARD_WIDTH_IN;
  const h = CARD_HEIGHT_IN;

  panel.rect(0, 0, w, h, undefined);

  const qrSize = 0.95;
  panel.image(qrDataUrl, 'PNG', PAD_IN, (h - qrSize) / 2, qrSize, qrSize);

  setInk(doc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.primary);
  const textX = PAD_IN + qrSize + 0.12;
  const textW = w - textX - PAD_IN;
  panel.text(t(locale, 'pdf.walletCard.scanQr').toUpperCase(), textX, PAD_IN + 0.06);

  setInk(doc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...PDF_COLORS.muted);
  let y = PAD_IN + 0.24;
  panel.text(t(locale, 'pdf.walletCard.contacts').toUpperCase(), textX, y);
  y += 0.13;

  setInk(doc);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const primaryContacts = profile.emergencyContacts.filter((c) => c.isPrimary);
  const contacts = (primaryContacts.length > 0 ? primaryContacts : profile.emergencyContacts).slice(0, 2);
  if (contacts.length === 0) {
    panel.text(t(locale, 'pdf.walletCard.none'), textX, y);
    y += 0.14;
  } else {
    for (const contact of contacts) {
      const line = `${contact.name}${contact.phone ? ` — ${contact.phone}` : ''}`;
      const wrapped = doc.splitTextToSize(line, textW);
      panel.text(wrapped[0] ?? line, textX, y);
      y += 0.14;
    }
  }

  if (profile.doctor.phone) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...PDF_COLORS.muted);
    panel.text(t(locale, 'emergency.doctor').toUpperCase(), textX, y + 0.02);
    y += 0.15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setInk(doc);
    panel.text(profile.doctor.phone, textX, y);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...PDF_COLORS.muted);
  panel.text(t(locale, 'pdf.walletCard.footer'), PAD_IN, h - PAD_IN + 0.02);
}

function drawGuides(doc: jsPDF, pageH: number): void {
  const cutX0 = MARGIN_IN;
  const cutY0 = MARGIN_IN;
  const cutX1 = MARGIN_IN + CARD_WIDTH_IN * 2;
  const cutY1 = MARGIN_IN + CARD_HEIGHT_IN;

  doc.setDrawColor(...PDF_COLORS.muted);
  doc.setLineWidth(0.006);
  drawDashedLine(doc, cutX0, cutY0, cutX1, cutY0, 0.06, 0.04);
  drawDashedLine(doc, cutX0, cutY1, cutX1, cutY1, 0.06, 0.04);
  drawDashedLine(doc, cutX0, cutY0, cutX0, cutY1, 0.06, 0.04);
  drawDashedLine(doc, cutX1, cutY0, cutX1, cutY1, 0.06, 0.04);

  const foldX = MARGIN_IN + CARD_WIDTH_IN;
  doc.setDrawColor(...PDF_COLORS.primary);
  drawDashedLine(doc, foldX, cutY0 - 0.05, foldX, cutY1 + 0.05, 0.03, 0.025);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text('CUT', cutX0, cutY0 - 0.03);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('FOLD', foldX - 0.09, pageH - 0.03);
}

/**
 * Builds Template A: a foldable emergency wallet card (3.375 × 2.125 in)
 * laid out as two panels on one sheet with fold and cut guides. The left
 * panel is the front (name, blood type, conditions, allergy badge); the
 * right panel is the back, rotated 180° so it reads correctly once the
 * sheet is folded along the shared edge (QR code + emergency contacts).
 */
export async function generateWalletCardPdf(profile: Profile, options: WalletCardOptions): Promise<jsPDF> {
  const { siteOrigin, locale } = options;
  const pageW = MARGIN_IN * 2 + CARD_WIDTH_IN * 2;
  const pageH = MARGIN_IN * 2 + CARD_HEIGHT_IN;

  const doc = new jsPDF({ unit: 'in', orientation: 'landscape', format: [pageW, pageH] });
  doc.setProperties({ title: 'Cadence — Emergency Wallet Card' });
  doc.setLineWidth(0.01);

  const { dataUrl: qrDataUrl } = await emergencyQrCodeDataUrl(profile, siteOrigin, 320);

  drawFrontPanel(doc, profile, locale, MARGIN_IN, MARGIN_IN);
  drawBackPanel(doc, profile, locale, qrDataUrl, MARGIN_IN + CARD_WIDTH_IN, MARGIN_IN);
  drawGuides(doc, pageH);

  return doc;
}
