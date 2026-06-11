import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Inbox,
  CalendarDays,
  Star,
  Wallet,
  Menu,
  X,
  Home,
  Building2,
  Globe,
} from "lucide-react";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Übersicht", path: "/", icon: LayoutGrid },
  { label: "Kunden", path: "/kunden", icon: Users },
  { label: "Anfragen", path: "/anfragen", icon: Inbox },
  { label: "Termine", path: "/termine", icon: CalendarDays },
  { label: "Website", path: "/website", icon: Globe },
  { label: "Bewertungen", path: "/bewertungen", icon: Star },
  { label: "Finanzen", path: "/finanzen", icon: Wallet },
  { label: "Firma", path: "/firma", icon: Building2 },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useOnboardingGuard();

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
                <Home className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <div className="font-heading font-extrabold text-lg tracking-tight">
                  <span className="text-blue-900">Meister</span>
                  <span className="text-blue-600">Flow</span>
                </div>
                <div className="text-[9px] font-semibold tracking-[0.25em] text-blue-600 mt-0.5">
                  KUNDENPORTAL
                </div>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              {NAV.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(path)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <button
              className="xl:hidden p-2 rounded-lg hover:bg-muted text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="xl:hidden border-t border-border bg-card px-4 py-3 grid grid-cols-2 gap-1">
            {NAV.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium",
                  isActive(path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}