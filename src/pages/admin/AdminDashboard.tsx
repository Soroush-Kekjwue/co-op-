import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.stats, {});
  const seedDemo = useMutation(api.admin.seedDemo);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo({});
      toast.success("داده‌های نمونه ایجاد شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ایجاد داده نمونه ناموفق بود.");
    } finally {
      setSeeding(false);
    }
  };

  const cards = [
    {
      icon: ClipboardList,
      label: "کل سفارش‌ها",
      value: stats?.totalOrders,
      hint: stats ? `${stats.pendingOrders} در انتظار تأیید` : "",
    },
    {
      icon: TrendingUp,
      label: "درآمد پرداخت‌شده",
      value: stats ? formatToman(stats.revenue) : undefined,
      hint: "",
    },
    {
      icon: Users,
      label: "مشتریان",
      value: stats?.customers,
      hint: "",
    },
    {
      icon: Package,
      label: "محصولات",
      value: stats?.products,
      hint: "",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">نمای کلی</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            وضعیت فروشگاه، سفارش‌ها و انبار در یک نگاه.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleSeed}
          disabled={seeding || (stats?.products ?? 0) > 0}
        >
          {seeding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4 text-accent" />
          )}
          افزودن داده‌های نمونه
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label} className="border-border/70 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {value === undefined
                  ? "…"
                  : typeof value === "number"
                    ? new Intl.NumberFormat("fa-IR").format(value)
                    : value}
              </div>
              {hint && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              سفارش‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                هنوز سفارشی ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentOrders.map(({ order, customerName }) => (
                  <Link
                    key={order._id}
                    to={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_BADGE_CLASSES[order.status] ?? ""}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <span className="truncate text-xs text-muted-foreground">
                        {customerName}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold text-primary">
                      {formatToman(order.total)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link to="/admin/orders">مشاهده همه سفارش‌ها</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <AlertTriangle className="size-4 text-accent" />
              موجودی کم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                همه محصولات موجودی کافی دارند.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.lowStock.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-3 text-sm"
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[11px] ${
                        p.stock === 0
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-accent/40 bg-accent/15 text-accent-foreground"
                      }`}
                    >
                      {new Intl.NumberFormat("fa-IR").format(p.stock)} {p.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link to="/admin/inventory">مدیریت انبار</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
