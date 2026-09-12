import "server-only";
import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/components/pagination-bar";
import { normalizeSearchText } from "@/lib/format";

export async function getProducts({ query, page }: { query?: string; page: number }) {
  const all = await db.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Filtered in JS (rather than a DB `contains`) so accentuation is ignored —
  // Postgres' default collation treats "ó" and "o" as different characters.
  const trimmed = query?.trim();
  const matches = trimmed
    ? all.filter((product) => {
        const needle = normalizeSearchText(trimmed);
        return (
          normalizeSearchText(product.name).includes(needle) ||
          (product.shelf && normalizeSearchText(product.shelf).includes(needle)) ||
          (product.barcode && normalizeSearchText(product.barcode).includes(needle))
        );
      })
    : all;

  const total = matches.length;
  const products = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { products, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
