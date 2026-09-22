"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createProduct } from "@/app/dashboard/(pages)/estoque/lib/actions";
import { keepFormValues } from "@/lib/keep-form-values";
import { Field, CurrencyInput, FormMessage } from "@/components/ui/form";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState(createProduct, undefined);

  return (
    <form onSubmit={keepFormValues(action)} className="flex flex-col gap-4">
      <MultiImageUpload name="images" />

      <Field label="Nome" htmlFor="name" error={state?.errors?.name} required>
        <Input id="name" name="name" placeholder="Ex: Pastilha de Freio Traseira" required />
      </Field>

      <Field label="Código de barras (opcional)" htmlFor="barcode" error={state?.errors?.barcode}>
        <Input id="barcode" name="barcode" placeholder="Ex: 7891234567890" />
      </Field>

      <Field label="Prateleira (opcional)" htmlFor="shelf" error={state?.errors?.shelf}>
        <Input id="shelf" name="shelf" placeholder="Ex: Prateleira 3, Corredor A" />
      </Field>

      <div className={isAdmin ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : undefined}>
        {isAdmin && (
          <Field label="Custo (R$, opcional)" htmlFor="costCents" error={state?.errors?.costCents}>
            <CurrencyInput id="costCents" name="costCents" />
          </Field>
        )}
        <Field label="Preço de venda (R$, opcional)" htmlFor="priceCents" error={state?.errors?.priceCents}>
          <CurrencyInput id="priceCents" name="priceCents" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Quantidade inicial" htmlFor="quantity" error={state?.errors?.quantity} required>
          <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" required />
        </Field>
        <Field label="Estoque mínimo (opcional)" htmlFor="minStock" error={state?.errors?.minStock}>
          <Input id="minStock" name="minStock" type="number" min="0" defaultValue="0" />
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
