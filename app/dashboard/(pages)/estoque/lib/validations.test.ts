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

  it.each(["", "   ", null])("treats a %j shelf as no shelf", (shelf) => {
    const result = ProductSchema.safeParse({ ...validProduct, shelf });
    expect(result.success).toBe(true);
    expect(result.data?.shelf).toBeNull();
  });

  it.each(["", "   ", null])("treats a %j barcode as no barcode", (barcode) => {
    const result = ProductSchema.safeParse({ ...validProduct, barcode });
    expect(result.success).toBe(true);
    expect(result.data?.barcode).toBeNull();
  });

  it("trims a provided barcode", () => {
    const result = ProductSchema.safeParse({ ...validProduct, barcode: " 789 " });
    expect(result.data?.barcode).toBe("789");
  });

  it("requires only name and quantity — cost, price and min stock default to 0", () => {
    const result = ProductSchema.safeParse({ name: "Óleo 10W40", quantity: "10" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      barcode: null,
      shelf: null,
      costCents: 0,
      priceCents: 0,
      minStock: 0,
      quantity: 10,
    });
  });

  it("treats empty cost, price and min stock as 0", () => {
    const result = ProductSchema.safeParse({ ...validProduct, costCents: "", priceCents: "", minStock: "" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ costCents: 0, priceCents: 0, minStock: 0 });
  });

  it("still requires a quantity", () => {
    expect(ProductSchema.safeParse({ ...validProduct, quantity: undefined }).success).toBe(false);
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
