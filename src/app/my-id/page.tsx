import type { Metadata } from "next";
import { RecordEditor } from "@/components/record-editor";
import { SELF_RECORD_ID } from "@/lib/types";

export const metadata: Metadata = { title: "My Medical ID" };

export default function MyIdPage() {
  return <RecordEditor recordId={SELF_RECORD_ID} kind="self" title="My Medical ID" />;
}
