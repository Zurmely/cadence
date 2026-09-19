import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn();
const addImage = vi.fn();
const addPage = vi.fn();
const toPng = vi.fn().mockResolvedValue("data:image/png;base64,page");

vi.mock("jspdf", () => ({
  jsPDF: class {
    save = save;
    addImage = addImage;
    addPage = addPage;
  },
}));
vi.mock("html-to-image", () => ({ toPng }));

import { downloadElementsAsPdf, pdfFilename, PDF_PAGE_SIZES } from "./pdf";

describe("PDF generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders every document page into one downloadable PDF", async () => {
    const pages = [document.createElement("section"), document.createElement("section")];
    await downloadElementsAsPdf(pages, PDF_PAGE_SIZES.wallet, "medical-id.pdf");

    expect(toPng).toHaveBeenCalledTimes(2);
    expect(addPage).toHaveBeenCalledTimes(1);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledWith("medical-id.pdf");
  });

  it("creates a safe, descriptive filename", () => {
    expect(pdfFilename("Margaret O'Connor", "cadence", "letter")).toBe(
      "margaret-o-connor-medication-cadence-letter.pdf"
    );
  });
});
