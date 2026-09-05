import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/format";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function AdminOrders() {
  const [status, setStatus] = useState<string>("all");
  const orders = useQuery(api.admin.listOrders,
    status === "all" ? {} : { status: status as never },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">سفارش‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            بررسی، تغییر وضعیت و ثبت پرداخت سفارش‌ها.
          </p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders === undefined ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          سفارشی با این وضعیت یافت نشد.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">شماره</th>
                <th className="px-4 py-3 font-medium">مشتری</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
                <th className="px-4 py-3 font-medium">مبلغ</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">پرداخت</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(({ order, customerName }) => (
                <tr
                  key={order._id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="font-mono text-xs font-bold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3">{customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatJalali(order._creationTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">
                    {formatToman(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${STATUS_BADGE_CLASSES[order.status] ?? ""}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${STATUS_BADGE_CLASSES[order.paymentStatus] ?? ""}`}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
