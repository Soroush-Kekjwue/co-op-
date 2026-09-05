import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import {
  formatIsoDate,
  formatJalali,
  formatToman,
  QUALITY_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  toPersianDigits,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Leaf,
  Loader2,
  MapPin,
  MessagesSquare,
  Minus,
  Plus,
  ScrollText,
  ShoppingCart,
  Star,
  Thermometer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

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
  // QR printed on packaging: scanning opens this product's passport page.
  const passportUrl = `${window.location.origin}/product/${slug ?? ""}`;

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="archival-frame paper-grain flex flex-col items-center justify-center rounded-lg bg-card p-5 text-center">
                <div className="rounded-lg border border-border bg-white p-3">
                  <QRCodeSVG
                    value={passportUrl}
                    size={128}
                    aria-label="کد شناسنامه محصول"
                  />
                </div>
                <p className="mt-3 font-display text-sm font-bold">
                  شناسنامه قابل استعلام
                </p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  با دوربین موبایل اسکن کنید و شناسنامه محصول را ببینید.
                </p>
                <p className="mt-2 font-mono text-xs text-accent-foreground">
                  {passport[0]?.batch.batchCode ?? ""}
                </p>
              </div>
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

        {/* Questions & reviews */}
        <ProductComments productId={product._id} slug={slug ?? ""} />
      </main>
      <SiteFooter />
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} ستاره`}
          className={
            onChange
              ? "transition-transform hover:scale-110"
              : "cursor-default"
          }
          onClick={onChange ? () => onChange(star) : undefined}
        >
          <Star
            className={`size-4 ${
              star <= value
                ? "fill-accent text-accent"
                : "fill-muted text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ProductComments({
  productId,
  slug,
}: {
  productId: Id<"products">;
  slug: string;
}) {
  const { isAuthenticated } = useAuth();
  const data = useQuery(api.comments.listForProduct, { productId });
  const addComment = useMutation(api.comments.add);
  const removeMine = useMutation(api.comments.removeMine);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await addComment({
        productId,
        body: body.trim(),
        rating: rating > 0 ? rating : undefined,
      });
      setBody("");
      setRating(0);
      toast.success("دیدگاه شما ثبت شد؛ سپاس از همراهی!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ثبت دیدگاه ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await removeMine({ commentId });
      toast.success("دیدگاه شما حذف شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  };

  return (
    <section className="mt-14">
      <div className="divider-ornate mb-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <MessagesSquare className="size-5 text-primary" />
          پرسش‌ها و دیدگاه‌ها
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <div>
          {data === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-secondary/40"
                />
              ))}
            </div>
          ) : data.totalCount === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              هنوز دیدگاهی ثبت نشده؛ اولین نفر باشید!
            </div>
          ) : (
            <div className="space-y-3">
              {data.comments.map((c) => (
                <div
                  key={c._id}
                  className="paper-grain rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                        {c.authorName.slice(0, 1)}
                      </span>
                      <span className="text-sm font-medium">{c.authorName}</span>
                      {c.rating ? <StarRating value={c.rating} /> : null}
                      {!c.isApproved && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          نمایان برای شما
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {formatJalali(c.creationTime)}
                      {c.isMine && (
                        <button
                          type="button"
                          aria-label="حذف دیدگاه"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(c._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm leading-7 text-foreground/90">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div>
          <div className="paper-grain rounded-lg border border-border bg-card p-5">
            <h3 className="font-display text-base font-bold">
              دیدگاه خود را بنویسید
            </h3>
            {data && data.averageRating !== null && (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <StarRating value={Math.round(data.averageRating)} />
                میانگین {toPersianDigits(data.averageRating.toFixed(1))} از{" "}
                {toPersianDigits(data.ratingCount)} امتیاز
              </p>
            )}
            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    امتیاز شما (اختیاری)
                  </Label>
                  <div className="mt-1.5">
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="تجربه‌تان از این محصول را بنویسید یا سوالی بپرسید…"
                  required
                />
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={submitting || !body.trim()}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  ثبت دیدگاه
                </Button>
              </form>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-sm leading-7 text-muted-foreground">
                  برای ثبت دیدگاه ابتدا وارد حساب خود شوید.
                </p>
                <Button asChild size="sm" className="mt-3 rounded-full">
                  <Link
                    to={`/auth?returnTo=${encodeURIComponent(`/product/${slug}`)}`}
                  >
                    ورود | عضویت
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
