import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { formatJalali } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff, Loader2, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminComments() {
  const comments = useQuery(api.comments.listAll, {});
  const setApproved = useMutation(api.comments.setApproved);
  const removeAny = useMutation(api.comments.removeAny);

  const handleToggle = async (
    commentId: string,
    isApproved: boolean,
  ) => {
    try {
      await setApproved({ commentId: commentId as never, isApproved });
      toast.success(isApproved ? "دیدگاه نمایان شد." : "دیدگاه پنهان شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت.");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("این دیدگاه برای همیشه حذف شود؟")) return;
    try {
      await removeAny({ commentId: commentId as never });
      toast.success("دیدگاه حذف شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">دیدگاه‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مدیریت پرسش‌ها و دیدگاه‌های ثبت‌شده روی محصولات.
        </p>
      </div>

      {comments === undefined ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <ScrollText className="mx-auto mb-3 size-9 text-muted-foreground" />
          <p className="font-display text-lg font-bold">دیدگاهی ثبت نشده است</p>
          <p className="mt-1 text-sm text-muted-foreground">
            دیدگاه‌های اعضا روی صفحات محصولات این‌جا مدیریت می‌شود.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c._id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {c.authorName.slice(0, 1)}
                  </span>
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    روی «{c.productName}»
                  </span>
                  {!c.isApproved && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      پنهان
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleToggle(c._id, !c.isApproved)}
                    aria-label={c.isApproved ? "پنهان کردن" : "نمایان کردن"}
                  >
                    {c.isApproved ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c._id)}
                    aria-label="حذف"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-2.5 text-sm leading-7">{c.body}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {formatJalali(c._creationTime)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
