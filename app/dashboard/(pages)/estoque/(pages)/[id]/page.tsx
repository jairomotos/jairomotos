import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { formatCentsToBRL } from "@/lib/format";
import { getProductDetail } from "@/app/dashboard/(pages)/estoque/(pages)/[id]/lib/get-product-detail";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StockMovementsTable } from "@/app/dashboard/(pages)/estoque/(pages)/[id]/components/stock-movements-table";
import EditProductForm from "./components/edit-form";
import ProductPhotoForm from "./components/photo-form";
import StockMovementForm from "./components/stock-movement-form";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, user] = await Promise.all([getProductDetail(id), getCurrentUser()]);
  if (!detail) notFound();
  const { product, movements } = detail;
  const isAdmin = user.role === "ADMIN";

  const low = product.quantity <= product.minStock;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {product.name}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {product.shelf && `${product.shelf} · `}Estoque atual:{" "}
          <span
            className={
              low
                ? "inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400"
                : "font-semibold text-foreground"
            }
          >
            {low && <TriangleAlert className="size-3.5" />}
            {product.quantity} {product.unit}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Editar produto</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProductForm product={product} isAdmin={isAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fotos do produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductPhotoForm productId={product.id} images={product.images} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <StockMovementForm productId={product.id} />
          <Separator />
          <StockMovementsTable movements={movements} />
        </CardContent>
      </Card>

      {isAdmin && (
        <p className="text-sm text-muted-foreground">
          Custo: {formatCentsToBRL(product.costCents)} · Margem:{" "}
          {formatCentsToBRL(product.priceCents - product.costCents)}
        </p>
      )}
    </div>
  );
}
