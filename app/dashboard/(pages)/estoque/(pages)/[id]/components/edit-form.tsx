"use client";

import { useActionState } from "react";
import type { Product } from "@prisma/client";
import { Save } from "lucide-react";
import { updateProduct } from "@/app/dashboard/(pages)/estoque/lib/actions";
import { Field, CurrencyInput, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditProductForm({
  product,
  isAdmin,
}: {
  product: Product;
  isAdmin: boolean;
}) {
  const action = updateProduct.bind(null, product.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="name" error={state?.errors?.name} required>
        <Input id="name" name="name" defaultValue={product.name} required />
      </Field>

      <Field label="Código de barras (opcional)" htmlFor="barcode" error={state?.errors?.barcode}>
        <Input id="barcode" name="barcode" defaultValue={product.barcode ?? ""} />
      </Field>

      <Field label="Prateleira" htmlFor="shelf" error={state?.errors?.shelf} required>
        <Input id="shelf" name="shelf" defaultValue={product.shelf ?? ""} placeholder="Ex: Prateleira 3, Corredor A" required />
      </Field>

      <div className={isAdmin ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : undefined}>
        {isAdmin && (
          <Field label="Custo (R$)" htmlFor="costCents" error={state?.errors?.costCents} required>
            <CurrencyInput id="costCents" name="costCents" defaultValueCents={product.costCents} required />
          </Field>
        )}
        <Field label="Preço de venda (R$)" htmlFor="priceCents" error={state?.errors?.priceCents} required>
          <CurrencyInput id="priceCents" name="priceCents" defaultValueCents={product.priceCents} required />
        </Field>
      </div>

      <Field label="Estoque mínimo" htmlFor="minStock" error={state?.errors?.minStock} required>
        <Input
          id="minStock"
          name="minStock"
          type="number"
          min="0"
          defaultValue={product.minStock}
          required
        />
      </Field>

      {state?.message && <FormMessage message={state.message} tone="success" />}

      <div>
        <Button type="submit" disabled={pending} size="lg">
          <Save className="size-4" />
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
