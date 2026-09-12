import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import InvoiceForm from "@/app/dashboard/(pages)/notas/components/invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, unit: true, images: true } } } },
      services: true,
    },
  });

  if (!invoice) notFound();
  if (invoice.status === "CANCELED" || invoice.status === "PARTIAL") {
    redirect(`/dashboard/notas/${id}`);
  }

  // An approved note already took its items off the shelf, so the true
  // "available to sell" amount for those products is what's left in stock
  // plus whatever this note is currently holding.
  const reservedByProduct =
    invoice.status === "APPROVED"
      ? new Map(invoice.items.map((item) => [item.productId, item.quantity]))
      : new Map<string, number>();

  const activeProducts = await db.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      barcode: true,
      priceCents: true,
      quantity: true,
      unit: true,
      images: true,
    },
  });

  const products = activeProducts
    .map((p) => ({ ...p, quantity: p.quantity + (reservedByProduct.get(p.id) ?? 0) }))
    .filter((p) => p.quantity > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar nota #${invoice.number}`}
        description={
          invoice.status === "APPROVED"
            ? "Adicione ou remova itens e serviços. O estoque e o financeiro são ajustados automaticamente."
            : "Altere os itens, serviços ou o desconto enquanto a nota estiver pendente."
        }
      />
      <Card className="max-w-3xl">
        <CardContent>
          <InvoiceForm
            products={products}
            invoice={{
              id: invoice.id,
              customerName: invoice.customer.name,
              customerPhone: invoice.customer.phone,
              notes: invoice.notes,
              discountCents: invoice.discountCents,
              items: invoice.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images[0] ?? null,
                unit: item.product.unit,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
              })),
              services: invoice.services.map((service) => ({
                description: service.description,
                amountCents: service.amountCents,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
