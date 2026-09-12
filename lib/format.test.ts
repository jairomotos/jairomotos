import { describe, expect, it } from "vitest";
import {
  formatCentsToBRL,
  parseBRLToCents,
  formatDate,
  formatDateTime,
  normalizeSearchText,
} from "@/lib/format";

describe("formatCentsToBRL", () => {
  it("formats cents as BRL currency", () => {
    expect(formatCentsToBRL(150000)).toBe("R$ 1.500,00");
  });

  it("formats zero", () => {
    expect(formatCentsToBRL(0)).toBe("R$ 0,00");
  });
});

describe("parseBRLToCents", () => {
  it("parses a BRL-formatted string back to cents", () => {
    expect(parseBRLToCents("1.500,00")).toBe(150000);
  });

  it("parses a plain integer string", () => {
    expect(parseBRLToCents("50")).toBe(5000);
  });

  it("returns 0 for unparseable input", () => {
    expect(parseBRLToCents("abc")).toBe(0);
  });
});

describe("formatDate / formatDateTime", () => {
  it("formats a date as dd/mm/yyyy", () => {
    expect(formatDate(new Date(2026, 8, 5))).toBe("05/09/2026");
  });

  it("formats a date-time including hours and minutes", () => {
    const result = formatDateTime(new Date(2026, 8, 5, 14, 30));
    expect(result).toContain("05/09/2026");
    expect(result).toContain("14:30");
  });
});

describe("normalizeSearchText", () => {
  it("strips accents", () => {
    expect(normalizeSearchText("Pastilha de Freio Traseira")).toBe(
      "pastilha de freio traseira"
    );
  });

  it("lowercases and removes diacritics for matching", () => {
    expect(normalizeSearchText("ÓLEO 10W40")).toBe("oleo 10w40");
    expect(normalizeSearchText("oleo 10w40")).toBe(normalizeSearchText("ÓLEO 10W40"));
  });
});
