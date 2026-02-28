import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { DailyEntry } from "@/pages/DailyEntry";
import { Dashboard } from "@/pages/Dashboard";
import { Households } from "@/pages/Households";
import { MilkTypes } from "@/pages/MilkTypes";
import { MonthlySummary } from "@/pages/MonthlySummary";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// ── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const dailyEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/daily-entry",
  component: DailyEntry,
});

const householdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/households",
  component: Households,
});

const milkTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/milk-types",
  component: MilkTypes,
});

const monthlySummaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/monthly-summary",
  component: MonthlySummary,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dailyEntryRoute,
  householdsRoute,
  milkTypesRoute,
  monthlySummaryRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </>
  );
}
