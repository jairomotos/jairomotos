import Link from "next/link";
import { Package, TriangleAlert } from "lucide-react";
import { formatCentsToBRL } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { ClickableRow } from "@/components/clickable-row";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductButton } from "@/app/dashboard/(pages)/estoque/components/delete-product-button";
import type { getProducts } from "@/app/dashboard/(pages)/estoque/lib/get-products";

export function ProductsTable({
  products,
  emptyMessage,
  isAdmin,
}: {
  products: Awaited<ReturnType<typeof getProducts>>["products"];
  emptyMessage: string;
  isAdmin: boolean;
}) {
  return (
    <Card className="py-0">
      {products.length === 0 ? (
        <EmptyState icon={<Package className="size-10" />} message={emptyMessage} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Prateleira</TableHead>
              {isAdmin && <TableHead className="text-right">Custo</TableHead>}
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              {isAdmin && <TableHead className="w-14"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const low = product.quantity <= product.minStock;
              return (
                <ClickableRow key={product.id} href={`/dashboard/estoque/${product.id}`}>
                  <TableCell>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Package className="size-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/estoque/${product.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.shelf || "—"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatCentsToBRL(product.costCents)}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCentsToBRL(product.priceCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        low
                          ? "inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400"
                          : "text-foreground"
                      }
                    >
                      {low && <TriangleAlert className="size-3.5" />}
                      {product.quantity} {product.unit}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </TableCell>
                  )}
                </ClickableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
