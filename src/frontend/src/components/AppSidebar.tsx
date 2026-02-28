import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Droplets,
  Home,
  LayoutDashboard,
  Milk,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/daily-entry", label: "Daily Entry", icon: ClipboardList },
  { to: "/households", label: "Households", icon: Home },
  { to: "/milk-types", label: "Milk Types", icon: Milk },
  { to: "/monthly-summary", label: "Monthly Summary", icon: BarChart3 },
];

export function AppSidebar() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-sidebar-primary/20">
          <Droplets className="w-4.5 h-4.5 text-sidebar-primary" size={18} />
        </div>
        <div>
          <span className="font-display font-bold text-sm text-sidebar-foreground tracking-tight">
            MilkTrack
          </span>
          <p className="text-xs text-sidebar-foreground/50 leading-none">
            Delivery Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-nav-item${isActive ? " active" : ""}`}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 leading-relaxed">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-sidebar-foreground/60 transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
