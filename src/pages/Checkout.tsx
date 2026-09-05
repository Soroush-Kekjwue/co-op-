import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { formatToman, toPersianDigits } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Loader2, Lock, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

const SHIPPING_FLAT_RATE = 49_000;

export default function Checkout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const checkout = useMutation(api.orders.checkout);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const products = useQuery(
    api.store.getProductsByIds,
    items.length > 0 ? { ids: items.map((i) => i.productId) } : "skip",
  );

  const detailed = (products ?? []).map((p) => {
    const cartItem = items.find((i) => i.productId === p._id);
    const quantity = cartItem?.quantity ?? 0;
    return { product: p, quantity, subtotal: p.price * quantity };
  });
  const subtotal = detailed.reduce((sum, d) => sum + d.subtotal, 0);
  const total = subtotal + SHIPPING_FLAT_RATE;

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/auth?returnTo=%2Fcheckout" replace />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <ShoppingCart className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">سبد خرید خالی است</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/shop">مشاهده محصولات</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await checkout({
        items,
        address: {
          fullName: String(form.get("fullName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          province: String(form.get("province") ?? ""),
          city: String(form.get("city") ?? ""),
          postalCode: String(form.get("postalCode") ?? ""),
          line: String(form.get("line") ?? ""),
        },
        paymentMethod:
          form.get("paymentMethod") === "bank_transfer"
            ? "bank_transfer"
            : "on_delivery",
        notes: String(form.get("notes") ?? "") || undefined,
      });
      clear();
      navigate(`/order/${result.orderId}`, { state: { justOrdered: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت سفارش ناموفق بود.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">تکمیل سفارش</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]"
        >
          <div className="space-y-6">
            <section className="paper-grain rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold">اطلاعات گیرنده</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">نام و نام خانوادگی</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    name="phone"
                    inputMode="tel"
                    pattern="09[0-9]{9}"
                    title="شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="province">استان</Label>
                  <Input id="province" name="province" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">شهر</Label>
                  <Input id="city" name="city" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode">کد پستی</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    title="کد پستی ۱۰ رقمی است"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="line">نشانی کامل</Label>
                <Textarea id="line" name="line" rows={2} required />
              </div>
            </section>

            <section className="paper-grain rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold">روش پرداخت</h2>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 has-[:checked]:border-primary">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="on_delivery"
                    defaultChecked
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      پرداخت در محل (هنگام تحویل)
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-muted-foreground">
                      مبلغ هنگام دریافت بسته از مأمور ارسال تسویه می‌شود.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 has-[:checked]:border-primary">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      کارت به کارت / انتقال بانکی
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-muted-foreground">
                      پس از ثبت سفارش، مشخصات حساب تعاونی اعلام می‌شود؛ مدیر
                      پس از تأیید واریزی، سفارش را پرداخت‌شده ثبت می‌کند.
                    </span>
                  </span>
                </label>
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-md bg-secondary/60 p-3 text-xs leading-6 text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                درگاه پرداخت اینترنتی در نسخه بعدی فعال می‌شود؛ فعلاً پرداخت
                در محل یا انتقال بانکی با تأیید مدیر فعال است.
              </p>
            </section>

            <section className="paper-grain rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold">
                توضیحات سفارش (اختیاری)
              </h2>
              <Textarea
                name="notes"
                rows={2}
                className="mt-3"
                placeholder="مثلاً زمان مناسب تحویل…"
              />
            </section>
          </div>

          <aside>
            <div className="paper-grain rounded-lg border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold">خلاصه سفارش</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {detailed.map(({ product, quantity, subtotal: s }) => (
                  <li key={product._id} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      {product.name} × {toPersianDigits(quantity)}
                    </span>
                    <span className="shrink-0">{formatToman(s)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">جمع کالاها</span>
                  <span>{formatToman(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هزینه ارسال</span>
                  <span>{formatToman(SHIPPING_FLAT_RATE)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-primary">{formatToman(total)}</span>
                </div>
              </div>
              {error && (
                <p className="mt-4 flex items-start gap-1.5 rounded-md bg-destructive/10 p-3 text-xs leading-6 text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full rounded-full"
                disabled={submitting || products === undefined}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                ثبت نهایی سفارش
              </Button>
              <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
                با ثبت سفارش، موجودی کالاها رزرو و قیمت‌ها قطعی می‌شود.
              </p>
            </div>
          </aside>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
