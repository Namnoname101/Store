import { describe, it, expect } from "vitest";
import LocketAutoClient from "@/components/admin/LocketAutoClient";
import LocketAutoPage from "@/app/admin/locket-auto/page";

describe("Admin Locket Auto UI Components", () => {
  it("exports a valid LocketAutoClient component", () => {
    expect(typeof LocketAutoClient).toBe("function");
  });

  it("exports a valid LocketAutoPage component", () => {
    expect(typeof LocketAutoPage).toBe("function");
  });
});
