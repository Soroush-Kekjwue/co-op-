import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toPersianDigits } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ClipboardCheck,
  MapPin,
  Store,
  Users,
} from "lucide-react";
import { Link } from "react-router";

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
      <section className="paper-grain relative overflow-hidden border-b border-border/70 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
            <Badge variant="outline" className="vintage-stamp mb-5 bg-card/80">
              تعاونی تولید و تأمین مواد غذایی
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.5] md:text-5xl md:leading-[1.5]">
              غذای اصیل،
              <br />
              از مزرعه تا سفره
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
              تعاونی ما میان تولیدکنندگان منتخب و خانوارها می‌ایستد؛ با منشأ
              مشخص، بچ ثبت‌شده و کنترل کیفیت مستند. اولین محصول، پرتقال باغ
              خودمان در سوادکوه است.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/shop">مشاهده محصولات</Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-card/60"
                >
                  <Link to="/auth?returnTo=%2Fshop">ورود اعضا</Link>
                </Button>
              )}
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" /> مبدأ مشخص
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
            <div className="archival-frame paper-grain relative w-72 rounded-lg bg-card p-8 text-center">
              <div className="vintage-stamp mx-auto mb-4 flex size-20 items-center justify-center font-display text-4xl">
                ب
              </div>
              <p className="font-display text-xl font-bold">از تولید تا سفره</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                تولیدکننده ← تعاونی ← کنترل کیفیت ← سفره شما
              </p>
              <div className="divider-ornate mt-4 text-xs">
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
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="divider-ornate mb-8">
            <h2 className="font-display text-2xl font-bold">دسته‌بندی‌ها</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category.slug}`}
                className="paper-grain flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-5 text-center transition-shadow hover:shadow-md"
              >
                <span className="vintage-stamp flex size-11 items-center justify-center font-display text-xl">
                  {category.name.slice(0, 1)}
                </span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="divider-ornate mb-8">
          <h2 className="font-display text-2xl font-bold">منتخب تعاونی</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>

      {/* Seasonal */}
      {seasonal.length > 0 && (
        <section className="paper-grain border-y border-border/70 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="divider-ornate mb-8">
              <h2 className="font-display text-2xl font-bold">محصولات فصلی</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {seasonal.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="divider-ornate mb-10">
          <h2 className="font-display text-2xl font-bold">چرا بازار تعاونی؟</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MapPin,
              title: "منشأ مشخص",
              text: "استان، شهر و باغ یا شالیزار مبدأ هر محصول ثبت می‌شود.",
            },
            {
              icon: Users,
              title: "تولیدکنندگان منتخب",
              text: "همکاری مستقیم با خانواده‌های تولیدکننده، بدون واسطه‌های اضافه.",
            },
            {
              icon: ClipboardCheck,
              title: "کنترل کیفیت مستند",
              text: "هر بچ پیش از عرضه بررسی و نتیجه آن ثبت می‌شود.",
            },
            {
              icon: Store,
              title: "خرید مستقیم‌تر",
              text: "قیمت منصفانه برای تولیدکننده، قیمت شفاف برای شما.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="paper-grain rounded-lg border border-border bg-card p-6"
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
      </section>

      {/* Story / CTA */}
      <section className="paper-grain border-t border-border/70 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">داستان تولید ما</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-[1.6]">
            «از درخت تا سبد شما،
            <br />
            با یک بچ ثبت‌شده»
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-muted-foreground">
            پرتقال‌های ما در باغ تعاونی سوادکوه کاشته شده‌اند؛ برداشت دستی،
            بسته‌بندی همان روز و ارسال مستقیم. روی هر جعبه، شماره بچ و تاریخ
            برداشت را می‌بینید.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link to="/shop">مشاهده محصولات</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            هم‌اکنون {toPersianDigits(featured.length + seasonal.length)} محصول
            منتخب در فروشگاه
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
