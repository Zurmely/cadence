import { useEffect, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { saveRecords } from "@/lib/storage";
import { emptyMedicalId, newRecord } from "@/lib/types";
import { MedicalIdForm } from "./medical-id-form";

function SavingForm() {
  const [medicalId, setMedicalId] = useState(emptyMedicalId());
  useEffect(() => {
    const record = newRecord("self", "self");
    record.medicalId = medicalId;
    saveRecords([record]);
  }, [medicalId]);
  return <MedicalIdForm value={medicalId} onChange={setMedicalId} />;
}

describe("MedicalIdForm saving", () => {
  it("saves edited form values to browser storage", async () => {
    const user = userEvent.setup();
    render(<SavingForm />);

    await user.type(screen.getByLabelText(/Full name/), "Margaret Okafor");

    await waitFor(() => {
      const records = JSON.parse(localStorage.getItem("cadence:records:v1") ?? "[]");
      expect(records[0].medicalId.fullName).toBe("Margaret Okafor");
    });
  });
});
