# Milk Delivery Tracker

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Household management**: Create, view, update, and delete households (name, address, contact info).
- **Milk type management**: Define milk types (e.g. Full Cream, Skim, Toned, Double Toned, Soy).
- **Daily delivery entries**: Record daily milk deliveries per household — specify milk type, quantity in liters/bottles, and date.
- **Holiday marking**: Mark specific dates as holidays (no deliveries). On holidays, deliveries are suspended for all households.
- **Monthly summary view**: View all entries for a given month, showing totals per household and per milk type.
- **Entry status**: Each delivery entry shows whether it was delivered, skipped (holiday), or custom-skipped (individual household skip).

### Modify
- None (new project).

### Remove
- None (new project).

## Implementation Plan
1. **Backend (Motoko)**
   - Data models: Household, MilkType, DeliveryEntry (householdId, milkTypeId, date, quantity, status), HolidayDate.
   - CRUD for Households.
   - CRUD for MilkTypes.
   - Add/update/delete DeliveryEntries keyed by (householdId, date).
   - Mark/unmark holidays by date.
   - Query entries by month (all households).
   - Query entries by household.
   - Get all holidays.
   - Monthly summary: aggregate totals per household and per milk type.

2. **Frontend (React + Tailwind)**
   - Dashboard: today's delivery status overview for all households.
   - Households page: list, add, edit, delete households.
   - Milk Types page: manage milk types.
   - Daily Entry page: select date, mark holiday, then record quantity+type per household.
   - Monthly Summary page: tabular view of entries for selected month with totals.
   - Navigation sidebar or top nav.
   - Sample data seeded for demo purposes.
