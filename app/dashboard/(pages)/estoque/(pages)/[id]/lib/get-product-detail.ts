import "server-only";
import { db } from "@/lib/db";

export async function getProductDetail(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product?.active) return null;

  const movements = await db.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });

  return { product, movements };
}
