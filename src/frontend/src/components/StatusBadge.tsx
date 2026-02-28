import { cn } from "@/lib/utils";

type Status = "delivered" | "skipped" | "holiday" | "pending";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const labels: Record<Status, string> = {
  delivered: "Delivered",
  skipped: "Skipped",
  holiday: "Holiday",
  pending: "Pending",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        {
          "status-delivered": status === "delivered",
          "status-skipped": status === "skipped",
          "status-holiday": status === "holiday",
          "status-pending": status === "pending",
        },
        className,
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-[oklch(0.72_0.16_155)]": status === "delivered",
          "bg-[oklch(0.7_0.14_65)]": status === "skipped",
          "bg-[oklch(0.58_0.22_25)]": status === "holiday",
          "bg-[oklch(0.56_0.02_240)]": status === "pending",
        })}
      />
      {labels[status]}
    </span>
  );
}
