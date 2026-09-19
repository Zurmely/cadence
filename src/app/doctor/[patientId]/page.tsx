import type { Metadata } from "next";
import { RecordEditor } from "@/components/record-editor";

export const metadata: Metadata = { title: "Patient record" };

export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return (
    <RecordEditor
      recordId={patientId}
      kind="patient"
      title="Patient record"
      backHref="/doctor"
    />
  );
}
