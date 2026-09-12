"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCentsToBRL } from "@/lib/format";
import type { BoletoStats } from "@/app/dashboard/(pages)/financeiro/(pages)/boletos/lib/get-boletos";

const BARS = [
  { key: "upcoming", label: "A vencer", color: "var(--color-blue-500)" },
  { key: "dueSoon", label: "Vencendo", color: "var(--color-amber-500)" },
  { key: "overdue", label: "Vencido", color: "var(--color-red-500)" },
] as const;

type BarDatum = {
  key: string;
  label: string;
  color: string;
  count: number;
  amountCents: number;
};

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as BarDatum | undefined;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{data.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.count} boleto{data.count === 1 ? "" : "s"} ·{" "}
        <span className="font-medium text-popover-foreground">{formatCentsToBRL(data.amountCents)}</span>
      </p>
    </div>
  );
}

export function BoletoStatusChart({ stats }: { stats: BoletoStats }) {
  const data: BarDatum[] = BARS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: stats[key].count,
    amountCents: stats[key].amountCents,
  }));

  const hasData = stats.openCents > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="h-55">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={formatCentsToBRL}
              />
              <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="amountCents" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center">
            <span className="text-xs text-muted-foreground">Nenhum boleto em aberto</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Total em aberto</span>
        <span className="font-heading text-lg font-semibold text-foreground">
          {formatCentsToBRL(stats.openCents)}
        </span>
      </div>
    </div>
  );
}
