import type { DeliveryEntry, DeliveryStatus } from "@/backend.d";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// ── Households ──────────────────────────────────────────────────────────────

export function useHouseholds() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["households"],
    queryFn: () => actor!.getAllHouseholds(),
    enabled: !!actor && !isFetching,
  });
}

export function useCreateHousehold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      address,
      contactPhone,
    }: {
      name: string;
      address: string;
      contactPhone: string;
    }) => actor!.createHousehold(name, address, contactPhone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["households"] }),
  });
}

export function useUpdateHousehold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      address,
      contactPhone,
    }: {
      id: bigint;
      name: string;
      address: string;
      contactPhone: string;
    }) => actor!.updateHousehold(id, name, address, contactPhone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["households"] }),
  });
}

export function useDeleteHousehold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteHousehold(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["households"] }),
  });
}

// ── Milk Types ──────────────────────────────────────────────────────────────

export function useMilkTypes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["milkTypes"],
    queryFn: () => actor!.getAllMilkTypes(),
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMilkType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => actor!.createMilkType(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milkTypes"] }),
  });
}

export function useUpdateMilkType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: bigint; name: string }) =>
      actor!.updateMilkType(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milkTypes"] }),
  });
}

export function useDeleteMilkType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteMilkType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milkTypes"] }),
  });
}

// ── Holidays ────────────────────────────────────────────────────────────────

export function useHolidays() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["holidays"],
    queryFn: () => actor!.getAllHolidays(),
    enabled: !!actor && !isFetching,
  });
}

export function useMarkHoliday() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, note }: { date: string; note: string }) =>
      actor!.markHoliday(date, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useUnmarkHoliday() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => actor!.unmarkHoliday(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

// ── Delivery Entries ────────────────────────────────────────────────────────

export function useDeliveryEntriesForMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["deliveries", "month", month],
    queryFn: () => actor!.getDeliveryEntriesForMonth(month),
    enabled: !!actor && !isFetching && !!month,
  });
}

export function useAddDeliveryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    DeliveryEntry,
    Error,
    {
      householdId: bigint;
      milkTypeId: bigint;
      date: string;
      quantityLiters: number;
      status: DeliveryStatus;
    }
  >({
    mutationFn: ({ householdId, milkTypeId, date, quantityLiters, status }) =>
      actor!.addDeliveryEntry(
        householdId,
        milkTypeId,
        date,
        quantityLiters,
        status,
      ),
    onSuccess: (_data, vars) => {
      const month = vars.date.slice(0, 7);
      qc.invalidateQueries({ queryKey: ["deliveries", "month", month] });
      qc.invalidateQueries({ queryKey: ["monthlySummary", month] });
    },
  });
}

export function useUpdateDeliveryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      householdId,
      milkTypeId,
      date,
      quantityLiters,
      status,
    }: {
      id: bigint;
      householdId: bigint;
      milkTypeId: bigint;
      date: string;
      quantityLiters: number;
      status: DeliveryStatus;
    }) =>
      actor!.updateDeliveryEntry(
        id,
        householdId,
        milkTypeId,
        date,
        quantityLiters,
        status,
      ),
    onSuccess: (_data, vars) => {
      const month = vars.date.slice(0, 7);
      qc.invalidateQueries({ queryKey: ["deliveries", "month", month] });
      qc.invalidateQueries({ queryKey: ["monthlySummary", month] });
    },
  });
}

export function useDeleteDeliveryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: bigint; month: string }) =>
      actor!.deleteDeliveryEntry(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["deliveries", "month", vars.month] });
      qc.invalidateQueries({ queryKey: ["monthlySummary", vars.month] });
    },
  });
}

// ── Monthly Summary ─────────────────────────────────────────────────────────

export function useMonthlySummary(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["monthlySummary", month],
    queryFn: () => actor!.getMonthlySummary(month),
    enabled: !!actor && !isFetching && !!month,
  });
}
