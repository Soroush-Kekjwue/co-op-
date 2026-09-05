import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { toPersianDigits } from "@/lib/format";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Sprout,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function SiteHeader() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
    setSearch("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="paper-grain sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="vintage-stamp flex size-9 items-center justify-center font-display text-lg">
            هـ
          </span>
          <span className="font-display text-xl text-primary">هم‌بن</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link to="/" className="link-archival hover:text-primary">
            خانه
          </Link>
          <Link to="/shop" className="link-archival hover:text-primary">
            فروشگاه
          </Link>
          <Link
            to="/shop?filter=seasonal"
            className="link-archival hover:text-primary"
          >
            فصلی
          </Link>
          <Link to="/account" className="link-archival hover:text-primary">
            سفارش‌ها
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="relative mr-auto hidden sm:block">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="چه چیزی برای سفره‌تان می‌خواهید؟"
            aria-label="جستجوی محصول"
            className="h-9 w-44 bg-background/60 pr-9 text-sm md:w-56"
          />
        </form>

        <div className="mr-auto flex items-center gap-2 sm:mr-0">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative rounded-full bg-background/60"
          >
            <Link to="/cart" aria-label={`سبد خرید${count > 0 ? `، ${toPersianDigits(count)} کالا` : ""}`}>
              <ShoppingCart className="size-4" />
              {count > 0 && (
                <span className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {toPersianDigits(count)}
                </span>
              )}
            </Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full bg-background/60"
                >
                  <UserRound className="size-4" />
                  <span className="hidden max-w-24 truncate sm:inline">
                    {user?.name || user?.email || "حساب"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user?.email ?? "حساب کاربری"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="ml-2 size-4" />
                    پیشخوان من
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <Package className="ml-2 size-4" />
                    سفارش‌های من
                  </Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="ml-2 size-4" />
                      پنل مدیریت
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="ml-2 size-4" />
                  خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth?returnTo=%2Fshop">ورود | ثبت‌نام</Link>
            </Button>
          )}

          {/* Mobile navigation sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/60 md:hidden"
                aria-label="منوی اصلی"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-display">
                  <span className="vintage-stamp flex size-8 items-center justify-center text-base">
                    هـ
                  </span>
                  هم‌بن
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4">
                {[
                  { to: "/", label: "خانه", icon: Sprout },
                  { to: "/shop", label: "فروشگاه", icon: ShoppingCart },
                  { to: "/shop?filter=seasonal", label: "محصولات فصلی", icon: Package },
                  { to: "/account", label: "سفارش‌های من", icon: Package },
                  { to: "/dashboard", label: "پیشخوان من", icon: LayoutDashboard },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
                  >
                    <Icon className="size-4 text-primary" />
                    {label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/auth?returnTo=%2Fshop">ورود | ثبت‌نام</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
