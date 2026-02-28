import { DeliveryStatus } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddDeliveryEntry,
  useDeliveryEntriesForMonth,
  useHolidays,
  useHouseholds,
  useMarkHoliday,
  useMilkTypes,
  useUnmarkHoliday,
  useUpdateDeliveryEntry,
} from "@/hooks/useQueries";
import { formatDate, todayString } from "@/utils/dateUtils";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface RowState {
  milkTypeId: string;
  quantityLiters: string;
  status: DeliveryStatus;
  saving: boolean;
  saved: boolean;
  existingId?: bigint;
}

export function DailyEntry() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [holidayNote, setHolidayNote] = useState("");
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  const month = selectedDate.slice(0, 7);

  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const { data: milkTypes, isLoading: loadingMilkTypes } = useMilkTypes();
  const { data: holidays, isLoading: loadingHolidays } = useHolidays();
  const { data: deliveries, isLoading: loadingDeliveries } =
    useDeliveryEntriesForMonth(month);

  const addEntry = useAddDeliveryEntry();
  const updateEntry = useUpdateDeliveryEntry();
  const markHoliday = useMarkHoliday();
  const unmarkHoliday = useUnmarkHoliday();

  const todayHoliday = useMemo(
    () => holidays?.find((h) => h.date === selectedDate) ?? null,
    [holidays, selectedDate],
  );

  const isHoliday = todayHoliday !== null;

  // Compute default rows from backend data (no local state dependency)
  const defaultRows = useMemo<Record<string, RowState>>(() => {
    if (!households || !milkTypes || !deliveries) return {};
    const result: Record<string, RowState> = {};
    for (const h of households) {
      const key = h.id.toString();
      const existing = deliveries.find(
        (d) => d.householdId === h.id && d.date === selectedDate,
      );
      result[key] = {
        milkTypeId:
          existing?.milkTypeId.toString() ?? milkTypes[0]?.id.toString() ?? "",
        quantityLiters: existing?.quantityLiters.toString() ?? "1",
        status: existing?.status ?? DeliveryStatus.delivered,
        saving: false,
        saved: false,
        existingId: existing?.id,
      };
    }
    return result;
  }, [households, milkTypes, deliveries, selectedDate]);

  // Merge local edits over default rows
  const displayRows = useMemo<Record<string, RowState>>(() => {
    const merged: Record<string, RowState> = { ...defaultRows };
    for (const [key, row] of Object.entries(rows)) {
      merged[key] = row;
    }
    return merged;
  }, [defaultRows, rows]);

  function updateRow(householdId: string, patch: Partial<RowState>) {
    setRows((prev) => {
      const current = prev[householdId] ?? defaultRows[householdId] ?? {};
      return { ...prev, [householdId]: { ...current, ...patch } };
    });
  }

  async function saveRow(householdId: string) {
    const row = displayRows[householdId];
    if (!row) return;

    const milkTypeIdNum = milkTypes?.find(
      (m) => m.id.toString() === row.milkTypeId,
    )?.id;
    if (!milkTypeIdNum && row.status === DeliveryStatus.delivered) {
      toast.error("Please select a milk type");
      return;
    }

    updateRow(householdId, { saving: true, saved: false });

    try {
      const hId = BigInt(householdId);
      const mId = milkTypeIdNum ?? BigInt(row.milkTypeId || "0");
      const qty = Number.parseFloat(row.quantityLiters) || 0;

      if (row.existingId !== undefined) {
        await updateEntry.mutateAsync({
          id: row.existingId,
          householdId: hId,
          milkTypeId: mId,
          date: selectedDate,
          quantityLiters: qty,
          status: row.status,
        });
      } else {
        const newEntry = await addEntry.mutateAsync({
          householdId: hId,
          milkTypeId: mId,
          date: selectedDate,
          quantityLiters: qty,
          status: row.status,
        });
        if (newEntry && typeof newEntry === "object" && "id" in newEntry) {
          updateRow(householdId, {
            existingId: (newEntry as { id: bigint }).id,
          });
        }
      }

      updateRow(householdId, { saving: false, saved: true });
      toast.success("Entry saved");

      setTimeout(() => {
        updateRow(householdId, { saved: false });
      }, 2000);
    } catch {
      updateRow(householdId, { saving: false });
      toast.error("Failed to save entry");
    }
  }

  async function saveAll() {
    if (!households) return;
    const promises = households.map((h) => saveRow(h.id.toString()));
    await Promise.all(promises);
  }

  async function handleHolidayToggle(checked: boolean) {
    setSavingHoliday(true);
    try {
      if (checked) {
        await markHoliday.mutateAsync({
          date: selectedDate,
          note: holidayNote,
        });
        toast.success("Marked as holiday");
      } else {
        await unmarkHoliday.mutateAsync(selectedDate);
        setHolidayNote("");
        toast.success("Holiday removed");
      }
    } catch {
      toast.error("Failed to update holiday status");
    }
    setSavingHoliday(false);
  }

  const isLoading =
    loadingHouseholds ||
    loadingMilkTypes ||
    loadingHolidays ||
    loadingDeliveries;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">
          Daily Entry
        </h1>
        <p className="text-muted-foreground text-sm">
          Record milk deliveries for any date
        </p>
      </motion.div>

      {/* Date picker + Holiday toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-6">
              {/* Date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="date-picker"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Date
                </Label>
                <div className="relative">
                  <CalendarDays
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setRows({}); // reset local rows on date change
                    }}
                    className="pl-8 w-44 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(selectedDate)}
                </p>
              </div>

              {/* Holiday toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Holiday
                </Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isHoliday}
                    onCheckedChange={handleHolidayToggle}
                    disabled={savingHoliday || loadingHolidays}
                  />
                  {isHoliday ? (
                    <StatusBadge status="holiday" />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not a holiday
                    </span>
                  )}
                  {savingHoliday && (
                    <Loader2
                      size={14}
                      className="animate-spin text-muted-foreground"
                    />
                  )}
                </div>
              </div>

              {/* Holiday note */}
              {isHoliday && (
                <div className="space-y-1.5 flex-1 min-w-48">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Holiday Note
                  </Label>
                  <p className="text-xs text-muted-foreground italic">
                    {todayHoliday?.note || "No note"}
                  </p>
                </div>
              )}

              {!isHoliday && (
                <div className="ml-auto">
                  <Button
                    onClick={saveAll}
                    disabled={isLoading || !households?.length}
                    className="gap-2"
                  >
                    <Save size={14} />
                    Save All
                  </Button>
                </div>
              )}
            </div>

            {/* Add note for marking */}
            {!isHoliday && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="holiday-note"
                    className="text-xs text-muted-foreground"
                  >
                    To mark as holiday, toggle above. Note (optional):
                  </Label>
                  <Textarea
                    id="holiday-note"
                    value={holidayNote}
                    onChange={(e) => setHolidayNote(e.target.value)}
                    placeholder="e.g. National holiday, business closed..."
                    rows={1}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Holiday overlay */}
      {isHoliday && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-center gap-3 px-4 py-4 rounded-lg status-holiday border border-[oklch(0.58_0.22_25/0.2)]"
        >
          <AlertTriangle size={18} className="shrink-0" />
          <div>
            <p className="font-semibold">Holiday — No Deliveries</p>
            <p className="text-sm opacity-80 mt-0.5">
              {todayHoliday?.note || "This day is marked as a holiday."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Delivery table */}
      {!isHoliday && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  Household Deliveries
                </CardTitle>
                {milkTypes && milkTypes.length === 0 && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    No milk types configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {["s1", "s2", "s3", "s4"].map((k) => (
                    <Skeleton key={k} className="h-14 w-full" />
                  ))}
                </div>
              ) : !households?.length ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No households found. Add households first.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 items-center px-4 py-2 bg-muted/40">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Household
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Milk Type
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Qty (L)
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Save
                    </span>
                  </div>

                  {households.map((h) => {
                    const key = h.id.toString();
                    const row = displayRows[key];
                    if (!row) return null;

                    return (
                      <div
                        key={key}
                        className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 items-center px-4 py-2.5 hover:bg-muted/20 transition-colors"
                      >
                        {/* Name */}
                        <span className="text-sm font-medium text-foreground truncate">
                          {h.name}
                        </span>

                        {/* Milk Type */}
                        <Select
                          value={row.milkTypeId}
                          onValueChange={(v) =>
                            updateRow(key, { milkTypeId: v, saved: false })
                          }
                          disabled={row.status === DeliveryStatus.skipped}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {milkTypes?.map((mt) => (
                              <SelectItem
                                key={mt.id.toString()}
                                value={mt.id.toString()}
                                className="text-xs"
                              >
                                {mt.name}
                              </SelectItem>
                            ))}
                            {!milkTypes?.length && (
                              <SelectItem
                                value="none"
                                disabled
                                className="text-xs"
                              >
                                No milk types
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        {/* Quantity */}
                        <Input
                          type="number"
                          min="0"
                          step="0.25"
                          value={row.quantityLiters}
                          onChange={(e) =>
                            updateRow(key, {
                              quantityLiters: e.target.value,
                              saved: false,
                            })
                          }
                          disabled={row.status === DeliveryStatus.skipped}
                          className="h-8 text-xs"
                        />

                        {/* Status */}
                        <Select
                          value={row.status}
                          onValueChange={(v) =>
                            updateRow(key, {
                              status: v as DeliveryStatus,
                              saved: false,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value={DeliveryStatus.delivered}
                              className="text-xs"
                            >
                              Delivered
                            </SelectItem>
                            <SelectItem
                              value={DeliveryStatus.skipped}
                              className="text-xs"
                            >
                              Skipped
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Save button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveRow(key)}
                          disabled={row.saving}
                          className="h-8 w-16 text-xs"
                        >
                          {row.saving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : row.saved ? (
                            <CheckCircle2
                              size={12}
                              className="text-[oklch(0.72_0.16_155)]"
                            />
                          ) : (
                            "Save"
                          )}
                        </Button>
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
