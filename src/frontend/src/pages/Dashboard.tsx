import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouseholds } from "@/hooks/useQueries";
import { useHolidays } from "@/hooks/useQueries";
import { useDeliveryEntriesForMonth } from "@/hooks/useQueries";
import { currentMonthString, formatDate, todayString } from "@/utils/dateUtils";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, ClipboardList, Home } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
type HouseholdStatus = "delivered" | "skipped" | "holiday" | "pending";

export function Dashboard() {
  const today = todayString();
  const currentMonth = currentMonthString();

  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const { data: holidays, isLoading: loadingHolidays } = useHolidays();
  const { data: deliveries, isLoading: loadingDeliveries } =
    useDeliveryEntriesForMonth(currentMonth);

  const todayHoliday = useMemo(
    () => holidays?.find((h) => h.date === today) ?? null,
    [holidays, today],
  );

  const householdStatuses = useMemo<
    Array<{ id: bigint; name: string; status: HouseholdStatus }>
  >(() => {
    if (!households) return [];
    return households.map((h) => {
      if (todayHoliday) {
        return { id: h.id, name: h.name, status: "holiday" };
      }
      const entry = deliveries?.find(
        (d) => d.householdId === h.id && d.date === today,
      );
      return {
        id: h.id,
        name: h.name,
        status: (entry ? entry.status : "pending") as HouseholdStatus,
      };
    });
  }, [households, deliveries, today, todayHoliday]);

  const counts = useMemo(() => {
    const delivered = householdStatuses.filter(
      (h) => h.status === "delivered",
    ).length;
    const skipped = householdStatuses.filter(
      (h) => h.status === "skipped",
    ).length;
    const holiday = householdStatuses.filter(
      (h) => h.status === "holiday",
    ).length;
    const pending = householdStatuses.filter(
      (h) => h.status === "pending",
    ).length;
    return {
      delivered,
      skipped,
      holiday,
      pending,
      total: householdStatuses.length,
    };
  }, [householdStatuses]);

  const isLoading = loadingHouseholds || loadingHolidays || loadingDeliveries;

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(today)}
            </p>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Today's Overview
            </h1>
          </div>
          <Button asChild className="gap-2">
            <Link to="/daily-entry">
              <ClipboardList size={15} />
              Record Today's Deliveries
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Holiday Banner */}
      {todayHoliday && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg status-holiday border border-[oklch(0.58_0.22_25/0.2)]"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Today is a Holiday</p>
            {todayHoliday.note && (
              <p className="text-xs opacity-80 mt-0.5">{todayHoliday.note}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
      >
        {[
          {
            label: "Delivered",
            count: counts.delivered,
            status: "delivered" as HouseholdStatus,
          },
          {
            label: "Pending",
            count: counts.pending,
            status: "pending" as HouseholdStatus,
          },
          {
            label: "Skipped",
            count: counts.skipped,
            status: "skipped" as HouseholdStatus,
          },
          {
            label: "Holiday",
            count: counts.holiday,
            status: "holiday" as HouseholdStatus,
          },
        ].map(({ label, count, status }) => (
          <motion.div key={label} variants={itemVariants}>
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-4 px-4">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                        {count}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg">
                      <StatusBadge
                        status={status}
                        className="rounded-md px-1.5 py-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Household List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-3">
          Households ({counts.total})
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {["s1", "s2", "s3", "s4", "s5"].map((k) => (
              <Skeleton key={k} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : householdStatuses.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Home
                size={32}
                className="mx-auto text-muted-foreground/40 mb-3"
              />
              <p className="text-muted-foreground text-sm">
                No households yet.{" "}
                <Link to="/households" className="underline text-foreground/70">
                  Add households
                </Link>{" "}
                to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {householdStatuses.map(({ id, name, status }) => (
              <motion.div
                key={id.toString()}
                variants={itemVariants}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border shadow-xs hover:shadow-card transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <Home size={12} className="text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm text-foreground">
                    {name}
                  </span>
                </div>
                <StatusBadge status={status} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
