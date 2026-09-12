import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import InvoiceForm from "@/app/dashboard/(pages)/notas/components/invoice-form";

export default async function NewInvoicePage() {
  const products = await db.product.findMany({
    where: { active: true, quantity: { gt: 0 } },
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nova nota"
        description="Ao aprovar a nota, o estoque é baixado e o valor entra no financeiro automaticamente."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <InvoiceForm products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
