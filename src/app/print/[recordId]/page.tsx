import type { Metadata } from "next";
import { PrintView } from "./print-view";

export const metadata: Metadata = { title: "Print" };

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ doc?: string; format?: string }>;
}) {
  const { recordId } = await params;
  const { doc, format } = await searchParams;
  return (
    <PrintView
      recordId={recordId}
      doc={doc === "cadence" ? "cadence" : "id"}
      format={format ?? "wallet"}
    />
  );
}
