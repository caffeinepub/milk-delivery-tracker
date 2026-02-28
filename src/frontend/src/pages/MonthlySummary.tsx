import { DeliveryStatus } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeliveryEntriesForMonth,
  useHolidays,
  useHouseholds,
  useMilkTypes,
  useMonthlySummary,
} from "@/hooks/useQueries";
import {
  currentMonthString,
  formatMonth,
  getDayNumber,
  getDaysInMonth,
} from "@/utils/dateUtils";
import { BarChart3, ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type CellValue = number | "H" | "-";

export function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString());
  const days = useMemo(() => getDaysInMonth(selectedMonth), [selectedMonth]);

  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const { data: milkTypes, isLoading: loadingMilkTypes } = useMilkTypes();
  const { data: holidays } = useHolidays();
  const { data: deliveries, isLoading: loadingDeliveries } =
    useDeliveryEntriesForMonth(selectedMonth);
  const { data: summary, isLoading: loadingSummary } =
    useMonthlySummary(selectedMonth);

  const holidaySet = useMemo(
    () => new Set((holidays ?? []).map((h) => h.date)),
    [holidays],
  );

  // Build the grid: households × days
  const grid = useMemo<Record<string, Record<string, CellValue>>>(() => {
    if (!households || !deliveries) return {};
    const result: Record<string, Record<string, CellValue>> = {};
    for (const h of households) {
      const row: Record<string, CellValue> = {};
      for (const day of days) {
        if (holidaySet.has(day)) {
          row[day] = "H";
        } else {
          const entry = deliveries.find(
            (d) => d.householdId === h.id && d.date === day,
          );
          if (!entry) {
            row[day] = "-";
          } else if (entry.status === DeliveryStatus.skipped) {
            row[day] = "-";
          } else if (entry.status === DeliveryStatus.holiday) {
            row[day] = "H";
          } else {
            row[day] = entry.quantityLiters;
          }
        }
      }
      result[h.id.toString()] = row;
    }
    return result;
  }, [households, deliveries, days, holidaySet]);

  // Per-household totals from summary
  const householdTotals = useMemo(() => {
    const map = new Map<string, number>();
    if (summary?.householdSummaries) {
      for (const [id, liters] of summary.householdSummaries) {
        map.set(id.toString(), liters);
      }
    }
    return map;
  }, [summary]);

  // Per-milk-type totals
  const milkTypeTotals = useMemo(() => {
    const map = new Map<string, number>();
    if (summary?.milkTypeSummaries) {
      for (const [id, liters] of summary.milkTypeSummaries) {
        map.set(id.toString(), liters);
      }
    }
    return map;
  }, [summary]);

  const totalLiters = useMemo(
    () => Array.from(householdTotals.values()).reduce((a, b) => a + b, 0),
    [householdTotals],
  );

  const isLoading =
    loadingHouseholds ||
    loadingDeliveries ||
    loadingSummary ||
    loadingMilkTypes;

  function cellClass(val: CellValue): string {
    if (val === "H")
      return "bg-[oklch(0.96_0.08_30)] text-[oklch(0.58_0.22_25)] font-bold";
    if (val === "-") return "text-muted-foreground";
    return "text-foreground font-medium";
  }

  return (
    <div className="p-6 lg:p-8 max-w-full mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Monthly Summary
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Delivery ledger and totals
            </p>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            >
              <ChevronLeft size={14} />
            </Button>
            <div className="min-w-36 text-center font-display font-semibold text-sm px-3 py-2 rounded-md border border-border bg-card">
              {formatMonth(selectedMonth)}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4 px-4">
            {isLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Total Deliveries
                </p>
                <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                  {totalLiters.toFixed(1)}
                  <span className="text-sm font-body font-normal text-muted-foreground ml-1">
                    L
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4 px-4">
            {isLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Households
                </p>
                <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                  {households?.length ?? 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4 px-4">
            {isLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Holidays
                </p>
                <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                  {days.filter((d) => holidaySet.has(d)).length}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4 px-4">
            {isLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Avg / Household
                </p>
                <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                  {households?.length
                    ? (totalLiters / households.length).toFixed(1)
                    : "0.0"}
                  <span className="text-sm font-body font-normal text-muted-foreground ml-1">
                    L
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delivery Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="font-display text-base">
              Delivery Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {["s1", "s2", "s3", "s4"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : !households?.length ? (
              <div className="py-12 text-center">
                <BarChart3
                  size={32}
                  className="mx-auto text-muted-foreground/30 mb-3"
                />
                <p className="text-muted-foreground text-sm">
                  No data for this month.
                </p>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="sticky left-0 z-10 bg-muted/40 text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider min-w-36 border-r border-border">
                          Household
                        </th>
                        {days.map((d) => {
                          const dayNum = getDayNumber(d);
                          const isHol = holidaySet.has(d);
                          return (
                            <th
                              key={d}
                              className={`px-1.5 py-2.5 text-center font-semibold uppercase tracking-wider min-w-10 ${
                                isHol
                                  ? "text-[oklch(0.58_0.22_25)] bg-[oklch(0.96_0.08_30)]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {dayNum}
                            </th>
                          );
                        })}
                        <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider min-w-20 border-l border-border">
                          Total (L)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {households.map((h, rowIdx) => {
                        const rowData = grid[h.id.toString()] ?? {};
                        const total = householdTotals.get(h.id.toString()) ?? 0;
                        return (
                          <tr
                            key={h.id.toString()}
                            className={`${
                              rowIdx % 2 === 0 ? "bg-card" : "bg-muted/20"
                            } hover:bg-accent/20 transition-colors`}
                          >
                            <td className="sticky left-0 z-10 px-4 py-2.5 font-medium text-foreground border-r border-border bg-inherit truncate max-w-36">
                              {h.name}
                            </td>
                            {days.map((d) => {
                              const val = rowData[d] ?? "-";
                              return (
                                <td
                                  key={d}
                                  className={`px-1 py-2.5 text-center ${cellClass(val)}`}
                                >
                                  {val === "H"
                                    ? "H"
                                    : val === "-"
                                      ? "–"
                                      : typeof val === "number"
                                        ? val % 1 === 0
                                          ? val
                                          : val.toFixed(1)
                                        : val}
                                </td>
                              );
                            })}
                            <td className="px-4 py-2.5 text-right font-bold text-foreground border-l border-border">
                              {total.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/60 border-t border-border">
                        <td className="sticky left-0 z-10 bg-muted/60 px-4 py-2.5 font-bold text-foreground border-r border-border uppercase text-xs tracking-wider">
                          Total
                        </td>
                        {days.map((d) => {
                          if (holidaySet.has(d)) {
                            return (
                              <td
                                key={d}
                                className="px-1 py-2.5 text-center text-[oklch(0.58_0.22_25)] font-bold text-xs"
                              >
                                H
                              </td>
                            );
                          }
                          const dayTotal =
                            households?.reduce((acc, h) => {
                              const entry = deliveries?.find(
                                (e) =>
                                  e.householdId === h.id &&
                                  e.date === d &&
                                  e.status === DeliveryStatus.delivered,
                              );
                              return acc + (entry?.quantityLiters ?? 0);
                            }, 0) ?? 0;
                          return (
                            <td
                              key={d}
                              className="px-1 py-2.5 text-center font-bold text-foreground text-xs"
                            >
                              {dayTotal > 0
                                ? dayTotal % 1 === 0
                                  ? dayTotal
                                  : dayTotal.toFixed(1)
                                : ""}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-right font-bold text-foreground border-l border-border">
                          {totalLiters.toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Milk Type Totals */}
      {!loadingMilkTypes && milkTypes && milkTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Droplets size={16} className="text-chart-1" />
                By Milk Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {milkTypes.map((mt) => {
                    const liters = milkTypeTotals.get(mt.id.toString()) ?? 0;
                    return (
                      <div
                        key={mt.id.toString()}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border"
                      >
                        <span className="text-sm font-medium text-foreground truncate mr-2">
                          {mt.name}
                        </span>
                        <span className="text-sm font-bold text-foreground shrink-0">
                          {liters.toFixed(1)}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">
                            L
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
