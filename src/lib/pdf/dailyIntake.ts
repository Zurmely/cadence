import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Locale, MessageKey } from '../i18n';
import { t } from '../i18n';
import { SCHEDULE_SLOTS, type Medication, type Profile, type ScheduleSlot } from '../profile';
import { PDF_COLORS, type PageFormat, pageSizeIn } from './layout';
import { glyphToPngDataUrl } from '../../components/glyph/render';

const MARGIN_IN = 0.6;
const GLYPH_PX = 64;
const GLYPH_IN = 0.26;

const SLOT_LABEL_KEY: Record<ScheduleSlot, MessageKey> = {
  morning: 'profile.slotMorning',
  afternoon: 'profile.slotAfternoon',
  evening: 'profile.slotEvening',
  bedtime: 'profile.slotBedtime',
};

export type DailyIntakeOptions = {
  locale: Locale;
  format: PageFormat;
};

async function buildGlyphMap(medications: Medication[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  await Promise.all(
    medications.map(async (med) => {
      try {
        map.set(med.id, await glyphToPngDataUrl(med.glyph, GLYPH_PX));
      } catch {
        map.set(med.id, null);
      }
    }),
  );
  return map;
}

/**
 * Builds Template B: a clinical daily intake schedule grouped into
 * Morning / Afternoon / Evening / Bedtime sections, each medication row
 * showing its dose, instructions, and medication glyph. Available in A4 and
 * Letter page sizes via `options.format`.
 */
export async function generateDailyIntakePdf(profile: Profile, options: DailyIntakeOptions): Promise<jsPDF> {
  const { locale, format } = options;
  const [pageW, pageH] = pageSizeIn(format);
  const doc = new jsPDF({ unit: 'in', format: [pageW, pageH] });
  doc.setProperties({ title: 'Cadence — Daily Intake Schedule' });

  const glyphMap = await buildGlyphMap(profile.medications);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.ink);
  doc.text(t(locale, 'pdf.dailyIntake.title'), MARGIN_IN, MARGIN_IN);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.muted);
  const subtitleParts = [profile.person.fullName || t(locale, 'pdf.dailyIntake.namePlaceholder')];
  const generatedOn = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
  subtitleParts.push(t(locale, 'pdf.dailyIntake.generatedOn', { date: generatedOn }));
  doc.text(subtitleParts.join('   •   '), MARGIN_IN, MARGIN_IN + 0.24);

  let cursorY = MARGIN_IN + 0.5;
  const contentWidth = pageW - MARGIN_IN * 2;
  let anyGroup = false;

  for (const slot of SCHEDULE_SLOTS) {
    const groupMeds = profile.medications.filter((med) => med.slots[slot]);
    if (groupMeds.length === 0) continue;
    anyGroup = true;

    if (cursorY > pageH - MARGIN_IN - 1) {
      doc.addPage();
      cursorY = MARGIN_IN;
    }

    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(MARGIN_IN, cursorY, contentWidth, 0.24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(t(locale, SLOT_LABEL_KEY[slot]).toUpperCase(), MARGIN_IN + 0.08, cursorY + 0.17);
    cursorY += 0.24;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_IN, right: MARGIN_IN },
      tableWidth: contentWidth,
      theme: 'grid',
      head: [
        [
          '',
          t(locale, 'profile.medicationName'),
          t(locale, 'profile.medicationDose'),
          t(locale, 'profile.medicationInstructions'),
        ],
      ],
      body: groupMeds.map((med) => ['', med.name, med.dose, med.instructions]),
      styles: { fontSize: 9, cellPadding: 0.08, minCellHeight: GLYPH_IN + 0.14, valign: 'middle' },
      headStyles: { fillColor: [235, 238, 241], textColor: [...PDF_COLORS.ink] },
      columnStyles: {
        0: { cellWidth: GLYPH_IN + 0.16 },
        1: { cellWidth: contentWidth * 0.28 },
        2: { cellWidth: contentWidth * 0.16 },
      },
      didDrawCell(data) {
        if (data.section !== 'body' || data.column.index !== 0) return;
        const med = groupMeds[data.row.index];
        const glyphUrl = med ? glyphMap.get(med.id) : null;
        if (!glyphUrl) return;
        const x = data.cell.x + (data.cell.width - GLYPH_IN) / 2;
        const y = data.cell.y + (data.cell.height - GLYPH_IN) / 2;
        doc.addImage(glyphUrl, 'PNG', x, y, GLYPH_IN, GLYPH_IN);
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 0.3;
  }

  if (!anyGroup) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(t(locale, 'pdf.dailyIntake.empty'), MARGIN_IN, cursorY);
  }

  return doc;
}
