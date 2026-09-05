import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PackageSearch, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function Account() {
  const { user } = useAuth();
  const orders = useQuery(api.orders.myOrders, {});
  const cancel = useMutation(api.orders.cancel);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancel({ orderId });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">سفارش‌های من</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.name ?? user?.email ?? ""}
        </p>

        {orders === undefined ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-secondary/40" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="paper-grain mt-8 rounded-lg border border-dashed border-border bg-card p-14 text-center">
            <PackageSearch className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="font-display text-lg font-bold">هنوز سفارشی ثبت نکرده‌اید</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/shop">شروع خرید</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="paper-grain rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${STATUS_BADGE_CLASSES[order.status] ?? ""}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${STATUS_BADGE_CLASSES[order.paymentStatus] ?? ""}`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ثبت: {formatJalali(order._creationTime)} — مبلغ:{" "}
                      {formatToman(order.total)}
                    </p>
                  </div>
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive"
                      disabled={cancellingId === order._id}
                      onClick={() => handleCancel(order._id)}
                    >
                      {cancellingId === order._id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      لغو سفارش
                    </Button>
                  )}
                </div>
                <OrderItemsLine orderId={order._id} />
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function OrderItemsLine({ orderId }: { orderId: string }) {
  const data = useQuery(api.orders.getOrder, { orderId });
  if (!data) return null;
  return (
    <p className="mt-3 border-t border-dashed border-border pt-3 text-xs leading-6 text-muted-foreground">
      اقلام:{" "}
      {data.items
        .map(
          (item) =>
            `${item.productNameSnapshot} × ${item.quantity.toLocaleString("fa-IR")}`,
        )
        .join("، ")}
    </p>
  );
}
