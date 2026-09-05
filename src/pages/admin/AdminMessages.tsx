import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { formatJalali } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Headset,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AdminMessages() {
  const threads = useQuery(api.messages.listThreads, {});
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const thread = useQuery(
    api.messages.listThread,
    activeUserId ? { userId: activeUserId as never } : "skip",
  );

  const sendMessage = useMutation(api.messages.send);
  const markThreadRead = useMutation(api.messages.markThreadRead);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark the open thread as read.
  useEffect(() => {
    if (activeUserId && thread !== undefined && thread.length > 0) {
      void markThreadRead({ userId: activeUserId as never });
    }
  }, [activeUserId, thread, markThreadRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.length]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeUserId) return;
    setSending(true);
    try {
      await sendMessage({ body, toUserId: activeUserId as never });
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال ناموفق بود.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">پیام‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          گفتگوی مستقیم اعضا با تعاونی — پاسخ‌ها در پیشخوان عضو نمایش داده می‌شود.
        </p>
      </div>

      {threads === undefined ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <MessageSquare className="mx-auto mb-3 size-9 text-muted-foreground" />
          <p className="font-display text-lg font-bold">پیامی نیست</p>
          <p className="mt-1 text-sm text-muted-foreground">
            وقتی عضوی پیامی بفرستد، این‌جا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Thread list */}
          <aside
            className={`space-y-2 ${activeUserId ? "hidden lg:block" : ""}`}
          >
            {threads.map((t) => (
              <button
                key={t.userId}
                type="button"
                onClick={() => setActiveUserId(t.userId)}
                className={`w-full rounded-lg border p-3 text-right transition-colors ${
                  activeUserId === t.userId
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {t.userName}
                  </span>
                  {t.unreadFromUser > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {new Intl.NumberFormat("fa-IR").format(t.unreadFromUser)}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {t.lastIsAdmin ? "شما: " : ""}
                  {t.lastBody}
                </p>
              </button>
            ))}
          </aside>

          {/* Thread view */}
          <div
            className={`rounded-lg border border-border bg-card ${
              activeUserId ? "" : "hidden lg:block"
            }`}
          >
            {activeUserId ? (
              <div className="flex h-[32rem] flex-col">
                <div className="flex items-center gap-3 border-b border-border p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 lg:hidden"
                    onClick={() => setActiveUserId(null)}
                    aria-label="بازگشت"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                  <span className="font-display text-base font-bold">
                    {threads.find((t) => t.userId === activeUserId)?.userName}
                  </span>
                </div>
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {(thread ?? []).map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.authorIsAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                          m.authorIsAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            m.authorIsAdmin
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {m.authorIsAdmin ? "شما — " : ""}
                          {formatJalali(m._creationTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 p-3"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="پاسخ خود را بنویسید…"
                    className="flex-1"
                    disabled={sending}
                    maxLength={4000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 rounded-full"
                    disabled={sending || !draft.trim()}
                    aria-label="ارسال پاسخ"
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Headset className="mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  یک گفتگو را از فهرست انتخاب کنید.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
