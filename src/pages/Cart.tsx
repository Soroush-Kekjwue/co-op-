import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/lib/cart";
import { formatToman, toPersianDigits } from "@/lib/format";
import { useQuery } from "convex/react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from "@/convex/shared";

export default function Cart() {
  const { items, update, remove, count } = useCart();
  const products = useQuery(api.store.getProductsByIds, {
    ids: items.map((i) => i.productId),
  });

  const detailed = (products ?? []).map((p) => {
    const cartItem = items.find((i) => i.productId === p._id);
    const quantity = cartItem?.quantity ?? 0;
    return { product: p, quantity, subtotal: p.price * quantity };
  });
  const subtotal = detailed.reduce((sum, d) => sum + d.subtotal, 0);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">سبد خرید</h1>

        {items.length === 0 ? (
          <div className="paper-grain mt-8 rounded-lg border border-dashed border-border bg-card p-14 text-center">
            <ShoppingBasket className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="font-display text-lg font-bold">سبد خرید شما خالی است</p>
            <p className="mt-1 text-sm text-muted-foreground">
              از میان محصولات تعاونی انتخاب کنید.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/shop">مشاهده محصولات</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Items */}
            <div className="space-y-4">
              {detailed.map(({ product, quantity, subtotal: itemSubtotal }) => (
                <div
                  key={product._id}
                  className="paper-grain flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="img-vintage flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/50">
                    <span className="font-display text-3xl text-accent/60">
                      {product.name.slice(0, 1)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-display font-bold hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {toPersianDigits(product.stock)} {product.unit} موجود —{" "}
                      {formatToman(product.price)} / هر {product.unit}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-input">
                        <button
                          type="button"
                          aria-label="کاهش"
                          className="p-2 text-muted-foreground hover:text-primary"
                          onClick={() => update(product._id, quantity - 1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {toPersianDigits(quantity)}
                        </span>
                        <button
                          type="button"
                          aria-label="افزایش"
                          className="p-2 text-muted-foreground hover:text-primary disabled:opacity-40"
                          disabled={quantity >= product.stock}
                          onClick={() => update(product._id, quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="حذف"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(product._id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-left font-bold text-primary">
                    {formatToman(itemSubtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside>
              <div className="paper-grain rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-lg font-bold">خلاصه سفارش</h2>
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      جمع کالاها ({toPersianDigits(count)} عدد)
                    </span>
                    <span>{formatToman(subtotal)}</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هزینه ارسال</span>
                  <span className={freeShipping ? "font-medium text-primary" : ""}>
                    {freeShipping ? "رایگان" : formatToman(SHIPPING_FLAT_RATE)}
                  </span>
                </div>
                {!freeShipping && (
                  <div className="rounded-md bg-secondary/60 p-3">
                    <p className="text-xs leading-6 text-muted-foreground">
                      فقط {formatToman(remainingForFreeShipping)} تا ارسال رایگان
                    </p>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="پیشرفت تا ارسال رایگان"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold">
                    <span>مبلغ قابل پرداخت</span>
                    <span className="text-primary">
                      {formatToman(subtotal + SHIPPING_FLAT_RATE)}
                    </span>
                  </div>
                </div>
                <Button asChild size="lg" className="mt-6 w-full rounded-full">
                  <Link to="/checkout">ادامه ثبت سفارش</Link>
                </Button>
                <Link
                  to="/shop"
                  className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary"
                >
                  ادامه خرید
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
