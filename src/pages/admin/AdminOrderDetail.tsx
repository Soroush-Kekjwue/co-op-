import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  toPersianDigits,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

export default function AdminOrderDetail() {
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const orderId =
    rawOrderId && /^[0-9a-z]{16,}$/.test(rawOrderId)
      ? (rawOrderId as Id<"orders">)
      : undefined;
  const data = useQuery(
    api.admin.getOrderDetail,
    orderId ? { orderId } : "skip",
  );
  const updateStatus = useMutation(api.admin.updateOrderStatus);
  const updatePayment = useMutation(api.admin.updatePaymentStatus);
  const [saving, setSaving] = useState(false);

  if (data === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="font-display text-lg font-bold">سفارش یافت نشد</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/orders">بازگشت به سفارش‌ها</Link>
        </Button>
      </div>
    );
  }

  const { order, items, customer } = data;

  const handleStatus = async (status: string) => {
    setSaving(true);
    try {
      await updateStatus({ orderId: order._id, status: status as never });
      toast.success("وضعیت سفارش به‌روزرسانی شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (paymentStatus: string) => {
    setSaving(true);
    try {
      await updatePayment({
        orderId: order._id,
        paymentStatus: paymentStatus as never,
      });
      toast.success("وضعیت پرداخت به‌روزرسانی شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/admin/orders" aria-label="بازگشت">
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-xl font-extrabold">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-muted-foreground">
              ثبت: {formatJalali(order._creationTime)}
            </p>
          </div>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold">اقلام سفارش</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {items.map((item) => (
                <li key={item._id} className="flex justify-between gap-3">
                  <span>
                    {item.productNameSnapshot} ×{" "}
                    {toPersianDigits(item.quantity)}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatToman(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
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
          </div>

          {/* Shipping info */}
          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <h2 className="font-display text-base font-bold">
              اطلاعات ارسال و پرداخت
            </h2>
            <dl className="mt-3 space-y-2 text-muted-foreground">
              <div>
                <dt className="inline text-foreground">گیرنده: </dt>
                <dd className="inline">
                  {order.recipientName} —{" "}
                  {toPersianDigits(order.recipientPhone)}
                </dd>
              </div>
              <div>
                <dt className="inline text-foreground">نشانی: </dt>
                <dd className="inline">{order.shippingAddress}</dd>
              </div>
              <div>
                <dt className="inline text-foreground">روش پرداخت: </dt>
                <dd className="inline">
                  {order.paymentMethod === "bank_transfer"
                    ? "کارت به کارت / انتقال بانکی"
                    : "پرداخت در محل"}
                </dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="inline text-foreground">توضیحات مشتری: </dt>
                  <dd className="inline">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold">مدیریت سفارش</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  وضعیت سفارش
                </label>
                <Select
                  value={order.status}
                  onValueChange={handleStatus}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  وضعیت پرداخت
                </label>
                <Select
                  value={order.paymentStatus}
                  onValueChange={handlePayment}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground">
                لغو سفارش موجودی کالاها را به انبار بازمی‌گرداند.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <h2 className="font-display text-base font-bold">مشتری</h2>
            <p className="mt-2 text-muted-foreground">
              {customer?.name || "—"}
            </p>
            <p dir="ltr" className="text-left text-xs text-muted-foreground">
              {customer?.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
