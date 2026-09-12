"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createProduct } from "@/app/dashboard/(pages)/estoque/lib/actions";
import { Field, CurrencyInput, FormMessage } from "@/components/ui/form";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState(createProduct, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <MultiImageUpload name="images" />

      <Field label="Nome" htmlFor="name" error={state?.errors?.name} required>
        <Input id="name" name="name" placeholder="Ex: Pastilha de Freio Traseira" required />
      </Field>

      <Field label="Código de barras" htmlFor="barcode" error={state?.errors?.barcode} required>
        <Input id="barcode" name="barcode" placeholder="Ex: 7891234567890" required />
      </Field>

      <Field label="Prateleira" htmlFor="shelf" error={state?.errors?.shelf} required>
        <Input id="shelf" name="shelf" placeholder="Ex: Prateleira 3, Corredor A" required />
      </Field>

      <div className={isAdmin ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : undefined}>
        {isAdmin && (
          <Field label="Custo (R$)" htmlFor="costCents" error={state?.errors?.costCents} required>
            <CurrencyInput id="costCents" name="costCents" required />
          </Field>
        )}
        <Field label="Preço de venda (R$)" htmlFor="priceCents" error={state?.errors?.priceCents} required>
          <CurrencyInput id="priceCents" name="priceCents" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Quantidade inicial" htmlFor="quantity" error={state?.errors?.quantity} required>
          <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" required />
        </Field>
        <Field label="Estoque mínimo" htmlFor="minStock" error={state?.errors?.minStock} required>
          <Input id="minStock" name="minStock" type="number" min="0" defaultValue="0" required />
        </Field>
      </div>

      {state?.message && <FormMessage message={state.message} />}

      <div>
        <Button type="submit" disabled={pending} size="lg">
          <Save className="size-4" />
          {pending ? "Salvando..." : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
