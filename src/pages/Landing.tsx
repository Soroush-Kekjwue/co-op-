import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toPersianDigits } from "@/lib/format";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ClipboardCheck, MapPin, Sprout, Store, Users } from "lucide-react";
import { Link } from "react-router";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

export default function Landing() {
  const { user } = useAuth();
  const categories = useQuery(api.store.listCategories, {});
  const featuredResult = useQuery(api.store.getFeaturedProducts, {});
  const featured = featuredResult?.featured ?? [];
  const seasonal = featuredResult?.seasonal ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 border-primary/30 bg-card px-3 py-1 text-primary"
            >
              <Sprout className="size-3.5" />
              تعاونی تولید و تأمین مواد غذایی
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.4] md:text-5xl md:leading-[1.4]">
              خوراک درست،
              <br />
              از مزرعه تا سفره
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
              هم‌بن میان تولیدکنندگان منتخب و خانوارها می‌ایستد؛ بدون واسطه‌های
              اضافه. هر محصول منشأ مشخص، بچ ثبت‌شده و کنترل کیفیت مستند دارد.
              اولین محصول ما، پرتقال باغ خودمان در سوادکوه است.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/shop">مشاهده محصولات</Link>
              </Button>
              {user ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-card/60"
                >
                  <Link to="/dashboard">پیشخوان من</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-card/60"
                >
                  <Link to="/auth?returnTo=%2Fdashboard">عضویت در هم‌بن</Link>
                </Button>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" /> منشأ مشخص
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="size-4 text-primary" /> کنترل کیفیت
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-primary" /> بدون واسطه
              </span>
            </div>
          </div>
          <div className="relative z-10 hidden justify-center md:flex">
            <div className="archival-frame relative w-72 rounded-lg bg-card p-8 text-center">
              <div className="vintage-stamp mx-auto mb-4 flex size-20 items-center justify-center font-display text-4xl">
                هـ
              </div>
              <p className="font-display text-xl font-bold">از تولید تا سفره</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                تولیدکننده ← تعاونی ← کنترل کیفیت ← سفره شما
              </p>
              <div className="divider-ornate mt-4 justify-center text-xs">
                <span>بچ ثبت‌شده</span>
              </div>
              <p className="mt-1 font-mono text-xs text-accent-foreground">
                ORG-1404-001
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <motion.section
          {...fadeInUp}
          className="mx-auto max-w-6xl px-4 py-12"
        >
          <div className="divider-ornate mb-8">
            <h2 className="font-display text-2xl font-extrabold">دسته‌بندی‌ها</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category.slug}`}
                className="paper-grain flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-display text-xl text-primary">
                  {category.name.slice(0, 1)}
                </span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Featured */}
      <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 pb-12">
        <div className="divider-ornate mb-8">
          <h2 className="font-display text-2xl font-extrabold">منتخب هم‌بن</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </motion.section>

      {/* Seasonal */}
      {seasonal.length > 0 && (
        <motion.section
          {...fadeInUp}
          className="border-y border-border/70 bg-secondary/30"
        >
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="divider-ornate mb-8">
              <h2 className="font-display text-2xl font-extrabold">
                محصولات فصلی
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {seasonal.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Why us */}
      <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 py-14">
        <div className="divider-ornate mb-10">
          <h2 className="font-display text-2xl font-extrabold">
            چرا هم‌بن؟
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MapPin,
              title: "منشأ مشخص",
              text: "استان، شهر و باغ یا شالیزار مبدأ هر محصول با دقت ثبت می‌شود.",
            },
            {
              icon: Users,
              title: "تولیدکنندگان منتخب",
              text: "همکاری مستقیم با خانواده‌های تولیدکننده، بدون واسطه‌های اضافه.",
            },
            {
              icon: ClipboardCheck,
              title: "کنترل کیفیت مستند",
              text: "هر بچ پیش از عرضه بررسی می‌شود و نتیجه آن در شناسنامه محصول ثبت می‌گردد.",
            },
            {
              icon: Store,
              title: "قیمت شفاف",
              text: "سهم منصفانه تولیدکننده، قیمت روشن برای شما؛ بدون هزینه پنهان.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="paper-grain rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Story / CTA */}
      <motion.section
        {...fadeInUp}
        className="border-t border-border/70 bg-secondary/30"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">داستان تولید ما</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.6]">
            «از درخت تا سبد شما،
            <br />
            با یک بچ ثبت‌شده»
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-muted-foreground">
            پرتقال‌های ما در باغ تعاونی سوادکوه کاشته شده‌اند؛ برداشت دستی،
            بسته‌بندی همان روز و ارسال مستقیم. روی هر جعبه، شماره بچ و تاریخ
            برداشت را می‌بینید.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/shop">مشاهده محصولات</Link>
            </Button>
            {user ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-card"
              >
                <Link to="/dashboard">پیشخوان من</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-card"
              >
                <Link to="/auth?returnTo=%2Fdashboard">عضویت در هم‌بن</Link>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            هم‌اکنون {toPersianDigits(featured.length + seasonal.length)} محصول
            منتخب در فروشگاه
          </p>
        </div>
      </motion.section>

      <SiteFooter />
    </div>
  );
}
