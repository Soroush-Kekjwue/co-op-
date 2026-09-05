import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/lib/cart";
import {
  formatIsoDate,
  formatToman,
  QUALITY_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  toPersianDigits,
} from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Leaf,
  MapPin,
  Minus,
  Plus,
  ScrollText,
  ShoppingCart,
  Thermometer,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  const data = useQuery(
    api.store.getProductBySlug,
    slug ? { slug } : "skip",
  );

  if (data === undefined) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-lg bg-secondary/40" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">محصول یافت نشد</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/shop">
              <ArrowLeft className="size-4" /> بازگشت به فروشگاه
            </Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { product, category, supplier, passport } = data;
  const inStock = product.stock > 0;
  const checkedBatches = passport.filter((p) => p.latestCheck);
  const passedCount = checkedBatches.filter(
    (p) => p.latestCheck?.status === "passed",
  ).length;

  const infoRows = [
    { icon: MapPin, label: "مبدأ", value: product.origin },
    { icon: Leaf, label: "تولیدکننده", value: product.producerDescription ?? supplier?.name },
    { icon: CalendarDays, label: "فصل تولید", value: product.season },
    { icon: Thermometer, label: "شرایط نگهداری", value: product.storageConditions },
  ].filter((r) => r.value);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">خانه</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary">فروشگاه</Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link
                to={`/shop?category=${category.slug}`}
                className="hover:text-primary"
              >
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery (vintage monogram placeholder for MVP) */}
          <div>
            <div className="img-vintage archival-frame flex h-80 items-center justify-center rounded-lg bg-secondary/50 md:h-[26rem]">
              <span className="font-display text-[7rem] text-accent/50">
                {product.name.slice(0, 1)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="img-vintage flex h-20 items-center justify-center rounded-lg border border-border bg-secondary/40"
                >
                  <span className="font-display text-2xl text-accent/40">
                    {product.name.slice(i, i + 1) || product.name.slice(0, 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase panel */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Badge variant="outline" className="bg-card">
                  {category.name}
                </Badge>
              )}
              {product.isSeasonal && (
                <Badge className="vintage-stamp bg-card">فصلی</Badge>
              )}
              <Badge
                className={
                  inStock
                    ? "border border-primary/40 bg-primary/15 text-primary"
                    : "border border-destructive/40 bg-destructive/10 text-destructive"
                }
              >
                {inStock ? `موجود (${toPersianDigits(product.stock)} ${product.unit})` : "ناموجود"}
              </Badge>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.5]">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-3 leading-7 text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-primary">
                {formatToman(product.price)}
              </span>
              <span className="text-sm text-muted-foreground">
                / هر {product.unit}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatToman(product.comparePrice)}
                </span>
              )}
            </div>

            <Separator className="my-6" />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-input">
                <button
                  type="button"
                  aria-label="کاهش"
                  className="p-2.5 text-muted-foreground hover:text-primary disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-medium">
                  {toPersianDigits(quantity)}
                </span>
                <button
                  type="button"
                  aria-label="افزایش"
                  className="p-2.5 text-muted-foreground hover:text-primary disabled:opacity-40"
                  disabled={!inStock || quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1 gap-2 rounded-full"
                disabled={!inStock}
                onClick={() => {
                  add(product._id, quantity);
                  navigate("/cart");
                }}
              >
                <ShoppingCart className="size-5" />
                {inStock ? "افزودن به سبد" : "ناموجود"}
              </Button>
            </div>

            {/* Product information */}
            <div className="mt-8">
              <h2 className="divider-ornate font-display text-lg font-bold">
                <span>مشخصات محصول</span>
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {infoRows.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <dt className="shrink-0 text-muted-foreground">{label}:</dt>
                    <dd className="leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
              {product.description && (
                <p className="mt-5 text-sm leading-8 text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {/* Quality summary */}
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-display text-base font-bold">
                <ClipboardCheck className="size-4 text-primary" />
                وضعیت کنترل کیفیت
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {checkedBatches.length === 0
                  ? "برای این محصول هنوز بررسی کیفیتی ثبت نشده است."
                  : `${toPersianDigits(passedCount)} از ${toPersianDigits(checkedBatches.length)} بچ ثبت‌شده، تأیید کیفیت گرفته است.`}
              </p>
            </div>
          </div>
        </div>

        {/* Product passport */}
        <section className="mt-14">
          <div className="divider-ornate mb-6">
            <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
              <ScrollText className="size-5 text-primary" />
              شناسنامه محصول
            </h2>
          </div>
          {passport.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              هنوز بچی برای این محصول ثبت نشده است.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {passport.map(({ batch, latestCheck }) => (
                <div
                  key={batch._id}
                  className="archival-frame paper-grain rounded-lg bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-bold text-accent-foreground">
                      {batch.batchCode}
                    </span>
                    {latestCheck ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] ${STATUS_BADGE_CLASSES[latestCheck.status] ?? ""}`}
                      >
                        {QUALITY_STATUS_LABELS[latestCheck.status]}
                      </span>
                    ) : (
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        بدون بررسی
                      </span>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <div>
                      <dt>تاریخ برداشت</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {batch.harvestDate ? formatIsoDate(batch.harvestDate) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>تاریخ بسته‌بندی</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {batch.packagingDate ? formatIsoDate(batch.packagingDate) : "—"}
                      </dd>
                    </div>
                    {batch.productionDate && (
                      <div>
                        <dt>تاریخ تولید</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {formatIsoDate(batch.productionDate)}
                        </dd>
                      </div>
                    )}
                    {latestCheck?.checkedAt && (
                      <div>
                        <dt>آخرین بررسی</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {new Date(latestCheck.checkedAt).toLocaleDateString("fa-IR")}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {latestCheck?.notes && (
                    <p className="mt-3 border-t border-dashed border-border pt-3 text-xs leading-6 text-muted-foreground">
                      {latestCheck.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
