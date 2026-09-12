import { describe, expect, it } from "vitest";
import { ProductSchema, StockEntrySchema } from "@/app/dashboard/(pages)/estoque/lib/validations";

describe("ProductSchema", () => {
  const validProduct = {
    name: "Óleo 10W40",
    barcode: "7891234567890",
    shelf: "Prateleira 3",
    costCents: "1000",
    priceCents: "2000",
    quantity: "10",
    minStock: "2",
  };

  it("accepts a valid product", () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("rejects a name that is too short", () => {
    const result = ProductSchema.safeParse({ ...validProduct, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty shelf", () => {
    const result = ProductSchema.safeParse({ ...validProduct, shelf: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty barcode", () => {
    const result = ProductSchema.safeParse({ ...validProduct, barcode: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = ProductSchema.safeParse({ ...validProduct, priceCents: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects an images entry that isn't a data: URI or an https:// URL", () => {
    const result = ProductSchema.safeParse({ ...validProduct, images: ["not-an-image"] });
    expect(result.success).toBe(false);
  });

  it("accepts an already-uploaded Cloudinary URL alongside a new photo", () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      images: ["https://res.cloudinary.com/demo/image/upload/v1/jairomotos/products/abc.webp", "data:image/webp;base64,xyz"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 photos", () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      images: Array.from({ length: 6 }, (_, i) => `data:image/webp;base64,${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("StockEntrySchema", () => {
  it("accepts a valid stock entry", () => {
    const result = StockEntrySchema.safeParse({
      productId: "abc123",
      type: "ENTRADA",
      quantity: "5",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid movement type", () => {
    const result = StockEntrySchema.safeParse({
      productId: "abc123",
      type: "INVALIDO",
      quantity: "5",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity below 1", () => {
    const result = StockEntrySchema.safeParse({
      productId: "abc123",
      type: "AJUSTE",
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });
});
