import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchForm } from "@/components/search-form";
import { PaginationBar } from "@/components/pagination-bar";
import { ProductsTable } from "@/app/dashboard/(pages)/estoque/components/products-table";
import { getProducts } from "@/app/dashboard/(pages)/estoque/lib/get-products";
import { getCurrentUser } from "@/lib/dal";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim();

  const [{ products, total, totalPages }, user] = await Promise.all([
    getProducts({ query, page }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estoque"
        description={`${total} produto(s) cadastrado(s)`}
        action={{ label: "Novo produto", href: "/dashboard/estoque/novo", icon: <Plus className="size-4" /> }}
      />

      <SearchForm
        action="/dashboard/estoque"
        placeholder="Buscar por nome, prateleira ou código de barras..."
        defaultValue={q}
      />

      <ProductsTable
        products={products}
        emptyMessage={query ? "Nenhum produto encontrado." : "Nenhum produto cadastrado ainda."}
        isAdmin={user.role === "ADMIN"}
      />

      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        basePath="/dashboard/estoque"
        searchParams={{ q }}
      />
    </div>
  );
}
