"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Bike,
  FileText,
  Wallet,
  Barcode,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Início",
    items: [
      { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true, adminOnly: true },
    ],
  },
  {
    label: "Estoque",
    items: [
      { href: "/dashboard/estoque", label: "Estoque", icon: Package },
      { href: "/dashboard/notas", label: "Notas", icon: FileText },
    ],
  },
  {
    label: "Motos",
    items: [
      { href: "/dashboard/motos", label: "Motos", icon: Bike },
      {
        href: "/dashboard/motos/financeiro",
        label: "Financeiro Motos",
        icon: Wallet,
        exact: true,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: Wallet, adminOnly: true },
      { href: "/dashboard/financeiro/boletos", label: "Boletos", icon: Barcode, adminOnly: true },
    ],
  },
  {
    label: "Administração",
    items: [{ href: "/dashboard/usuarios", label: "Usuários", icon: UserCog, adminOnly: true }],
  },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isAdmin || !item.adminOnly),
  })).filter((group) => group.items.length > 0);

  // Only the most specific match (longest href) is highlighted, so a nested
  // route like /dashboard/motos/financeiro doesn't light up both "Motos" and
  // its own item at once.
  const allItems = groups.flatMap((group) => group.items);
  const activeHref = allItems
    .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-col gap-4 p-3">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
