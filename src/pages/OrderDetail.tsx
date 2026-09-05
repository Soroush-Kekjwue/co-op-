import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  toPersianDigits,
} from "@/lib/format";
import { useQuery } from "convex/react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Link, useParams, useLocation } from "react-router";
import type { Id } from "@/convex/_generated/dataModel";

export default function OrderDetail() {
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const justOrdered = Boolean(location.state?.justOrdered);
  // Treat the route param as a Convex Id only when it looks like one.
  const orderId: Id<"orders"> | undefined =
    rawOrderId && /^[0-9a-z]{16,}$/.test(rawOrderId)
      ? (rawOrderId as Id<"orders">)
      : undefined;
  const data = useQuery(
    api.orders.getOrder,
    orderId ? { orderId } : "skip",
  );

  if (data === undefined) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="h-64 animate-pulse rounded-lg bg-secondary/40" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">سفارش یافت نشد</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/account">سفارش‌های من</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { order, items } = data;
  const paymentMethodLabel =
    order.paymentMethod === "bank_transfer"
      ? "کارت به کارت / انتقال بانکی"
      : "پرداخت در محل";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        {justOrdered && (
          <div className="paper-grain mb-8 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-5">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <h1 className="font-display text-xl font-bold text-primary">
                سفارش شما با موفقیت ثبت شد
              </h1>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {order.paymentMethod === "bank_transfer"
                  ? "برای هماهنگی پرداخت، با شما تماس گرفته می‌شود."
                  : "مبلغ هنگام تحویل دریافت می‌شود."}{" "}
                وضعیت سفارش را می‌توانید از همین صفحه دنبال کنید.
              </p>
            </div>
          </div>
        )}

        <div className="paper-grain rounded-lg border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              <span className="font-mono text-lg font-bold">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={STATUS_BADGE_CLASSES[order.status] ?? ""}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <Badge
                variant="outline"
                className={STATUS_BADGE_CLASSES[order.paymentStatus] ?? ""}
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </Badge>
            </div>
          </div>

          <Separator className="my-5" />

          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li key={item._id} className="flex justify-between gap-3">
                <span>
                  {item.productNameSnapshot} ×{" "}
                  {toPersianDigits(item.quantity)}
                </span>
                <span className="shrink-0">{formatToman(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-5" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">جمع کالاها</span>
              <span>{formatToman(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">هزینه ارسال</span>
              <span>{formatToman(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>مبلغ کل</span>
              <span className="text-primary">{formatToman(order.total)}</span>
            </div>
          </div>

          <Separator className="my-5" />

          <dl className="space-y-2 text-sm text-muted-foreground">
            <div>
              <dt className="inline text-foreground">گیرنده: </dt>
              <dd className="inline">
                {order.recipientName} — {toPersianDigits(order.recipientPhone)}
              </dd>
            </div>
            <div>
              <dt className="inline text-foreground">نشانی: </dt>
              <dd className="inline">{order.shippingAddress}</dd>
            </div>
            <div>
              <dt className="inline text-foreground">روش پرداخت: </dt>
              <dd className="inline">{paymentMethodLabel}</dd>
            </div>
            <div>
              <dt className="inline text-foreground">تاریخ ثبت: </dt>
              <dd className="inline">{formatJalali(order._creationTime)}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="inline text-foreground">توضیحات: </dt>
                <dd className="inline">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 flex justify-between">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/account">سفارش‌های من</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/shop">ادامه خرید</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
