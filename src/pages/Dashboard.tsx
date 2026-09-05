import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  formatJalali,
  formatToman,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Headset,
  Loader2,
  MessageCircle,
  MessageCircleReply,
  Package,
  PackageSearch,
  Send,
  ShoppingBasket,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const orders = useQuery(api.orders.myOrders, {});
  const unreadReplies = useQuery(api.messages.unreadCountForUser, {});
  const messages = useQuery(api.messages.listThread, {});
  const sendMessage = useMutation(api.messages.send);
  const markThreadRead = useMutation(api.messages.markThreadRead);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark admin replies as read once the thread loads.
  useEffect(() => {
    if (messages === undefined) return;
    if ((unreadReplies ?? 0) > 0) {
      void markThreadRead({});
    }
  }, [messages, unreadReplies, markThreadRead]);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  const activeOrders = (orders ?? []).filter((o) =>
    ["pending", "confirmed", "processing", "ready", "shipped"].includes(o.status),
  );
  const totalSpent = (orders ?? [])
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await sendMessage({ body });
      setDraft("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ارسال پیام ناموفق بود.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">پیشخوان عضویت</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold">
              سلام{user?.name ? ` ${user.name}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              وضعیت سفارش‌ها و پیام‌های شما با تیم هم‌بن، همه در یک‌جا.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/shop">
              <ShoppingBasket className="size-4" />
              ادامه خرید
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Package,
              label: "کل سفارش‌ها",
              value: orders === undefined ? "…" : orders.length,
              to: "/account",
            },
            {
              icon: ShoppingBasket,
              label: "در جریان",
              value: orders === undefined ? "…" : activeOrders.length,
              to: "/account",
            },
            {
              icon: Wallet,
              label: "مجموع خریدها",
              value:
                orders === undefined ? "…" : formatToman(totalSpent),
              to: "/account",
            },
            {
              icon: MessageCircle,
              label: "پاسخ‌های خوانده‌نشده",
              value:
                unreadReplies === undefined ? "…" : unreadReplies,
              to: "#messages",
            },
          ].map(({ icon: Icon, label, value, to }) => (
            <Link
              key={label}
              to={to}
              className="paper-grain rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {typeof value === "number"
                  ? new Intl.NumberFormat("fa-IR").format(value)
                  : value}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Recent orders */}
          <section>
            <div className="divider-ornate mb-5">
              <h2 className="font-display text-xl font-extrabold">
                سفارش‌های اخیر
              </h2>
            </div>
            {orders === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg bg-secondary/40"
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
                <PackageSearch className="mx-auto mb-3 size-9 text-muted-foreground" />
                <p className="font-display text-lg font-bold">
                  هنوز سفارشی ثبت نکرده‌اید
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  اولین سبد خود را از محصولات تعاونی بچینید.
                </p>
                <Button asChild className="mt-5 rounded-full">
                  <Link to="/shop">شروع خرید</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 4).map((order) => (
                  <Link
                    key={order._id}
                    to={`/order/${order._id}`}
                    className="paper-grain block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${STATUS_BADGE_CLASSES[order.status] ?? ""}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${STATUS_BADGE_CLASSES[order.paymentStatus] ?? ""}`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowLeft className="size-3.5" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatJalali(order._creationTime)}
                      </span>
                      <span className="font-bold text-primary">
                        {formatToman(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
                {orders.length > 4 && (
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to="/account">مشاهده همه سفارش‌ها</Link>
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Messages */}
          <section id="messages">
            <div className="divider-ornate mb-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                <Headset className="size-5 text-primary" />
                گفتگو با هم‌بن
              </h2>
            </div>
            <div className="paper-grain flex flex-col rounded-lg border border-border bg-card">
              <div
                ref={scrollRef}
                className="max-h-96 min-h-48 space-y-3 overflow-y-auto p-4"
              >
                {messages === undefined ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-center">
                    <MessageCircleReply className="mb-2 size-7 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      سوالی درباره سفارش یا محصول دارید؟
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      همین‌جا بنویسید؛ تیم هم‌بن پاسخ می‌دهد.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.authorIsAdmin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                          m.authorIsAdmin
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            m.authorIsAdmin
                              ? "text-muted-foreground"
                              : "text-primary-foreground/70"
                          }`}
                        >
                          {m.authorIsAdmin ? "تیم هم‌بن — " : ""}
                          {formatJalali(m._creationTime)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Separator />
              <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="پیام خود را بنویسید…"
                  className="flex-1"
                  disabled={sending}
                  maxLength={4000}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 rounded-full"
                  disabled={sending || !draft.trim()}
                  aria-label="ارسال پیام"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </div>
            <p className="mt-2 px-1 text-[11px] leading-5 text-muted-foreground">
              برای پیگیری سفارش‌ها می‌توانید صفحه{" "}
              <Link to="/account" className="text-primary hover:underline">
                سفارش‌های من
              </Link>{" "}
              را ببینید.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
