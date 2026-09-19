import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CadenceSheet } from "./cadence-sheet";
import { emptyCadence, emptyMedicalId, newMedication } from "@/lib/types";

describe("CadenceSheet", () => {
  it("groups medicines by time and adds a weekly plan for selected days", () => {
    const id = { ...emptyMedicalId(), fullName: "Margaret Okafor" };
    const medication = {
      ...newMedication(),
      name: "Warfarin",
      dose: "3 mg",
      slots: ["evening" as const],
      days: ["Mon" as const, "Wed" as const, "Fri" as const],
    };
    const cadence = { ...emptyCadence(), medications: [medication] };

    render(<CadenceSheet id={id} cadence={cadence} format="a4" />);

    expect(screen.getByRole("heading", { name: /Evening/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Warfarin/)).toHaveLength(2);
    expect(screen.getByRole("heading", { name: /Weekly plan/ })).toBeInTheDocument();
    expect(screen.getAllByText("Take").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Do not take").length).toBeGreaterThan(0);
  });
});
