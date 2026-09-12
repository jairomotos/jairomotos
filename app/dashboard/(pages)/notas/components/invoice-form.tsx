"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Save, Search, Package } from "lucide-react";
import {
  createInvoice,
  updateInvoice,
} from "@/app/dashboard/(pages)/notas/lib/actions";
import { Field, CurrencyInput, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL, normalizeSearchText } from "@/lib/format";
import type { InvoiceFormState } from "@/app/dashboard/(pages)/notas/lib/validations";

type ProductOption = {
  id: string;
  name: string;
  barcode: string | null;
  priceCents: number;
  quantity: number;
  unit: string;
  images: string[];
};
type ItemRow = {
  id: number;
  productId: string;
  productName: string;
  productImage: string | null;
  maxQuantity: number;
  unit: string;
  quantity: number;
  priceCents: number;
};
type ServiceRow = { id: number; description: string; amountCents: number };

type ExistingInvoice = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
  discountCents: number;
  items: {
    productId: string;
    productName: string;
    productImage: string | null;
    unit: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  services: { description: string; amountCents: number }[];
};

let rowIdCounter = 0;
function nextId() {
  rowIdCounter += 1;
  return rowIdCounter;
}

export default function InvoiceForm({
  products,
  invoice,
}: {
  products: ProductOption[];
  invoice?: ExistingInvoice;
}) {
  async function boundAction(state: InvoiceFormState, formData: FormData) {
    return invoice ? updateInvoice(invoice.id, state, formData) : createInvoice(state, formData);
  }

  const [state, action, pending] = useActionState(boundAction, undefined);
  const [itemRows, setItemRows] = useState<ItemRow[]>(() =>
    (invoice?.items ?? []).map((item) => ({
      id: nextId(),
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      maxQuantity: products.find((p) => p.id === item.productId)?.quantity ?? item.quantity,
      unit: item.unit,
      quantity: item.quantity,
      priceCents: item.unitPriceCents,
    }))
  );
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>(() =>
    (invoice?.services ?? []).map((service) => ({
      id: nextId(),
      description: service.description,
      amountCents: service.amountCents,
    }))
  );
  const [discountCents, setDiscountCents] = useState(invoice?.discountCents ?? 0);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const addedProductIds = new Set(itemRows.map((r) => r.productId));
  const results =
    query.trim().length > 0
      ? products
          .filter((p) => !addedProductIds.has(p.id))
          .filter((p) => {
            const needle = normalizeSearchText(query.trim());
            return (
              normalizeSearchText(p.name).includes(needle) ||
              (p.barcode && normalizeSearchText(p.barcode).includes(needle))
            );
          })
          .slice(0, 8)
      : [];

  function addProduct(product: ProductOption) {
    setItemRows((prev) => [
      ...prev,
      {
        id: nextId(),
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] ?? null,
        maxQuantity: product.quantity,
        unit: product.unit,
        quantity: 1,
        priceCents: product.priceCents,
      },
    ]);
    setQuery("");
    setShowResults(false);
  }

  function updateItemRow(id: number, patch: Partial<ItemRow>) {
    setItemRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeItemRow(id: number) {
    setItemRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateServiceRow(id: number, patch: Partial<ServiceRow>) {
    setServiceRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addServiceRow() {
    setServiceRows((prev) => [...prev, { id: nextId(), description: "", amountCents: 0 }]);
  }

  function removeServiceRow(id: number) {
    setServiceRows((prev) => prev.filter((r) => r.id !== id));
  }

  const itemsTotal = itemRows.reduce((sum, r) => sum + r.quantity * r.priceCents, 0);
  const servicesTotal = serviceRows.reduce((sum, r) => sum + r.amountCents, 0);
  const subtotal = itemsTotal + servicesTotal;
  const appliedDiscount = Math.min(discountCents, subtotal);
  const total = subtotal - appliedDiscount;

  return (
    <form action={action} className="flex flex-col gap-6">
      {invoice ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="text-sm font-medium text-foreground">{invoice.customerName}</p>
          {invoice.customerPhone && (
            <p className="text-xs text-muted-foreground">{invoice.customerPhone}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do cliente" htmlFor="customerName" error={state?.errors?.customerName} required>
            <Input id="customerName" name="customerName" placeholder="Ex: João Silva" required />
          </Field>
          <Field label="Celular do cliente (opcional)" htmlFor="customerPhone" error={state?.errors?.customerPhone}>
            <Input id="customerPhone" name="customerPhone" type="tel" placeholder="(11) 99999-0000" />
          </Field>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">Itens (peças do estoque)</span>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou código de barras..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
          />
          {showResults && query.trim().length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
              {results.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-muted-foreground">
                  Nenhum produto com estoque encontrado.
                </p>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => addProduct(p)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <Package className="size-4 text-muted-foreground/40" />
                        )}
                      </span>
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.quantity} {p.unit} · {formatCentsToBRL(p.priceCents)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {itemRows.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
        )}

        {itemRows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_90px_140px_auto] sm:items-end"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {row.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.productImage}
                    alt={row.productName}
                    className="size-full object-cover"
                  />
                ) : (
                  <Package className="size-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">{row.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {row.maxQuantity} {row.unit} em estoque
                </span>
              </div>
              <input type="hidden" name="productId" value={row.productId} />
            </div>

            <Field label="Qtd." htmlFor={`quantity-${row.id}`}>
              <Input
                id={`quantity-${row.id}`}
                type="number"
                min="1"
                max={row.maxQuantity}
                value={row.quantity}
                onChange={(e) => updateItemRow(row.id, { quantity: Number(e.target.value) })}
                required
              />
              <input type="hidden" name="quantity" value={row.quantity} />
            </Field>

            <Field label="Preço unit. (R$)" htmlFor={`price-${row.id}`}>
              <CurrencyInput
                id={`price-${row.id}`}
                name="unitPriceCents"
                defaultValueCents={row.priceCents}
                onValueChange={(cents) => updateItemRow(row.id, { priceCents: cents })}
                required
              />
            </Field>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItemRow(row.id)}
              aria-label="Remover item"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Serviços (mão de obra)</span>
          <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
            <Plus className="size-3.5" />
            Adicionar serviço
          </Button>
        </div>

        {serviceRows.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum serviço adicionado.</p>
        )}

        {serviceRows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_140px_auto] sm:items-end"
          >
            <Field label="Descrição do serviço" htmlFor={`service-desc-${row.id}`}>
              <Input
                id={`service-desc-${row.id}`}
                placeholder="Ex: Troca da pastilha de freio"
                value={row.description}
                onChange={(e) => updateServiceRow(row.id, { description: e.target.value })}
                required
              />
              <input type="hidden" name="serviceDescription" value={row.description} />
            </Field>

            <Field label="Valor (R$)" htmlFor={`service-amount-${row.id}`}>
              <CurrencyInput
                id={`service-amount-${row.id}`}
                name="serviceAmountCents"
                defaultValueCents={row.amountCents}
                onValueChange={(cents) => updateServiceRow(row.id, { amountCents: cents })}
                required
              />
            </Field>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeServiceRow(row.id)}
              aria-label="Remover serviço"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {state?.message && <FormMessage message={state.message} />}

      <Field label="Observações (opcional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} defaultValue={invoice?.notes ?? ""} />
      </Field>

      <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCentsToBRL(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <Label htmlFor="discountCents">Desconto (R$)</Label>
          <div className="w-36">
            <CurrencyInput
              id="discountCents"
              name="discountCents"
              defaultValueCents={invoice?.discountCents}
              onValueChange={setDiscountCents}
            />
          </div>
        </div>
        {state?.errors?.discountCents && (
          <p className="text-right text-sm text-destructive">{state.errors.discountCents[0]}</p>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="font-heading text-lg font-semibold text-foreground tabular-nums">
            {formatCentsToBRL(total)}
          </span>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={pending} size="lg">
          <Save className="size-4" />
          {invoice
            ? pending
              ? "Salvando..."
              : "Salvar alterações"
            : pending
              ? "Criando..."
              : "Criar nota"}
        </Button>
      </div>
    </form>
  );
}
