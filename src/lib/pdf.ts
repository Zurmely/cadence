export type PdfPageSize = { width: number; height: number };

export const PDF_PAGE_SIZES: Record<string, PdfPageSize> = {
  wallet: { width: 85.6, height: 54 },
  fold: { width: 85.6, height: 108 },
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

export function pdfFilename(name: string, doc: "id" | "cadence", format: string) {
  const safeName =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "record";
  return `${safeName}-${doc === "id" ? "medical-id" : "medication-cadence"}-${format}.pdf`;
}

export async function downloadElementsAsPdf(
  elements: HTMLElement[],
  size: PdfPageSize,
  filename: string
) {
  if (elements.length === 0) throw new Error("No document pages were found.");

  const [{ jsPDF }, { toPng }] = await Promise.all([import("jspdf"), import("html-to-image")]);
  const orientation = size.width > size.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [size.width, size.height],
    compress: true,
  });

  for (let index = 0; index < elements.length; index += 1) {
    if (index > 0) pdf.addPage([size.width, size.height], orientation);
    const dataUrl = await toPng(elements[index], {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio: 2,
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, size.width, size.height, undefined, "FAST");
  }
  pdf.save(filename);
}
