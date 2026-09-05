import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { RequireAdmin } from "@/components/site/RequireAdmin";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  ScrollText,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useQuery } from "convex/react";

const NAV = [
  { to: "/admin", end: true, label: "نمای کلی", icon: LayoutDashboard },
  { to: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { to: "/admin/products", label: "محصولات و دسته‌ها", icon: Package },
  { to: "/admin/inventory", label: "انبار و کیفیت", icon: Layers },
  { to: "/admin/messages", label: "پیام‌ها", icon: MessageSquare, badge: true },
  { to: "/admin/comments", label: "دیدگاه‌ها", icon: ScrollText },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useQuery(api.messages.unreadCountForAdmin, {});
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile sidebar when navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-secondary/30">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="منوی مدیریت"
            >
              <Menu className="size-4" />
            </Button>
            <Link to="/admin" className="flex items-center gap-2">
              <span className="vintage-stamp flex size-8 items-center justify-center font-display text-base">
                هـ
              </span>
              <span className="font-display text-lg text-primary">
                پنل مدیریت هم‌بن
              </span>
            </Link>
            <div className="mr-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/">مشاهده فروشگاه</Link>
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleSignOut}
                aria-label="خروج"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
          {/* Sidebar */}
          <aside
            className={`${
              open ? "block" : "hidden"
            } fixed inset-x-4 top-16 z-30 rounded-lg border border-border bg-card p-3 shadow-lg lg:static lg:block lg:w-56 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            <nav className="space-y-1">
              {NAV.map(({ to, end, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-foreground/80 hover:bg-card hover:text-primary"
                    }`
                  }
                >
                  <Icon className="size-4" />
                  {label}
                  {badge && (unread ?? 0) > 0 && (
                    <span className="mr-auto flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {new Intl.NumberFormat("fa-IR").format(unread!)}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
