import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toPersianDigits } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardCheck,
  Hand,
  MapPin,
  Package,
  Send,
  ShoppingBasket,
  Sprout,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

/** Category slug → editorial tint class. */
const CATEGORY_TINTS: Record<string, string> = {
  citrus: "tint-citrus",
  grains: "tint-grain",
  spices: "tint-herb",
  oil: "tint-oil",
  sweets: "tint-sweet",
  nuts: "tint-nut",
};

const JOURNEY_STEPS = [
  { icon: Sprout, title: "باغ و مزرعه", text: "خاک، آب و هوای همان منطقه‌ای که محصول در آن رشد کرده است." },
  { icon: Hand, title: "برداشت", text: "برداشت دستی در فصل درست، نه پیش از رسیدن کامل." },
  { icon: ClipboardCheck, title: "کنترل کیفیت", text: "هر بچ پیش از عرضه بررسی و نتیجه‌اش ثبت می‌شود." },
  { icon: Package, title: "بسته‌بندی", text: "بسته‌بندی نزدیک به زمان برداشت، با شماره بچ روی هر جعبه." },
  { icon: Users, title: "تعاونی", text: "بدون واسطه‌های اضافه؛ سهم منصفانه‌ای برای تولیدکننده." },
  { icon: UtensilsCrossed, title: "سفره شما", text: "از مزرعه تا آشپزخانه، با منشأ قابل ردیابی." },
];

export default function Landing() {
  const { user } = useAuth();
  const categories = useQuery(api.store.listCategories, {});
  const featuredResult = useQuery(api.store.getFeaturedProducts, {});
  const freshArrivals = useQuery(api.store.getFreshArrivals, {});
  const featured = featuredResult?.featured ?? [];
  const seasonal = featuredResult?.seasonal ?? [];

  const subscribe = useMutation(api.newsletter.subscribe);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribe({ email });
      toast.success("عضویت شما ثبت شد؛ از فصل بعدی باخبرتان می‌کنیم.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت عضویت ناموفق بود.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* 01 — Hero */}
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
            <p className="eyebrow mb-3">تعاونی تولید و تأمین مواد غذایی</p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.5] md:text-5xl md:leading-[1.5]">
              از جایی که رشد می‌کند،
              <br />
              تا جایی که خورده می‌شود.
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
              هم‌بن محصولات را مستقیم از تولیدکنندگان منتخب به سفره خانوارها
              می‌رساند؛ با منشأ مشخص، شماره بچ و کنترل کیفیت مستند. اولین محصول
              ما، پرتقال باغ خودمان در سوادکوه است.
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

      {/* 02 — Discovery: this week at the cooperative */}
      {freshArrivals && freshArrivals.length > 0 && (
        <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 pt-14">
          <div className="divider-ornate mb-8">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <ShoppingBasket className="size-5 text-primary" />
              این هفته در تعاونی
            </h2>
          </div>
          <p className="-mt-4 mb-6 text-sm leading-7 text-muted-foreground">
            تازه‌ترین محصولات ثبت‌شده؛ از آخرین برداشت‌های تولیدکنندگان هم‌بن.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {freshArrivals.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </motion.section>
      )}

      {/* 03 — Featured */}
      <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 py-12">
        <div className="divider-ornate mb-8">
          <h2 className="font-display text-2xl font-extrabold">منتخب هم‌بن</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </motion.section>

      {/* 04 — Trust / Why us */}
      <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 pb-14">
        <div className="divider-ornate mb-10">
          <h2 className="font-display text-2xl font-extrabold">چرا هم‌بن؟</h2>
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

      {/* 05 — Categories: editorial tiles with independent personality */}
      {categories && categories.length > 0 && (
        <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 pb-14">
          <div className="divider-ornate mb-8">
            <h2 className="font-display text-2xl font-extrabold">
              دسته‌بندی‌ها
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category.slug}`}
                className={`flex h-32 flex-col justify-end rounded-lg border border-border/80 p-4 text-right transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
                  CATEGORY_TINTS[category.slug] ?? "tint-grain"
                }`}
              >
                <span className="font-display text-3xl text-foreground/25">
                  {category.name.slice(0, 1)}
                </span>
                <span className="mt-1 text-sm font-bold">{category.name}</span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* 06 — From farm to table: horizontal journey */}
      <motion.section
        {...fadeInUp}
        className="border-y border-border/70 bg-secondary/30"
      >
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="divider-ornate mb-10">
            <h2 className="font-display text-2xl font-extrabold">
              از مزرعه تا سفره
            </h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {JOURNEY_STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative">
                <span className="micro mb-3 flex items-center gap-2 text-muted-foreground">
                  <span className="flex size-9 items-center justify-center rounded-full border border-primary/30 bg-card text-primary">
                    <Icon className="size-4" />
                  </span>
                  گام {toPersianDigits(index + 1)}
                </span>
                <h3 className="font-display text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </motion.section>

      {/* 07 — Seasonal */}
      {seasonal.length > 0 && (
        <motion.section {...fadeInUp} className="mx-auto max-w-6xl px-4 py-12">
          <div className="divider-ornate mb-2">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <CalendarDays className="size-5 text-primary" />
              فصل پرتقال
            </h2>
          </div>
          <p className="mb-6 max-w-xl text-sm leading-7 text-muted-foreground">
            پنجره برداشت محدود است؛ بچ‌های فصلی همین حالا در فروشگاه هستند.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {seasonal.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </motion.section>
      )}

      {/* 08 — Community */}
      <motion.section
        {...fadeInUp}
        className="border-y border-border/70 bg-secondary/30"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <Badge
            variant="outline"
            className="mb-5 border-primary/30 bg-card px-3 py-1 text-primary"
          >
            <Sprout className="size-3.5" />
            تعاونی، فقط یک فروشگاه نیست
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-[1.6]">
            «خرید ما فقط خرید نیست؛ بخشی از یک زنجیره واقعی است.»
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
            هر سفارش، درآمد را مستقیم به خانواده‌های تولیدکننده می‌رساند و در
            مقابل، محصولی اصیل و قابل ردیابی به سفره شما می‌آورد. خانه‌های
            عضو، باغ‌ها و مزارع، همه در یک شبکه به هم پیوسته‌اند.
          </p>
        </div>
      </motion.section>

      {/* 09 — Newsletter */}
      <motion.section {...fadeInUp} className="mx-auto max-w-3xl px-4 py-14">
        <div className="paper-grain rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold">
            از فصل و برداشت باخبر شوید
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            شروع فصل برداشت، محصولات فصلی محدود و تازه‌های تعاونی؛ بدون تبلیغ
            اضافه.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mx-auto mt-6 flex max-w-md items-center gap-2"
          >
            <Input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="نشانی ایمیل"
              className="bg-background/70"
              required
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={subscribing}
              aria-label="عضویت در خبرنامه"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            هر زمان که بخواهید می‌توانید عضویت را لغو کنید.
          </p>
        </div>
      </motion.section>

      <SiteFooter />
    </div>
  );
}
