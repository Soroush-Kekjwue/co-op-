import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import {
  formatIsoDate,
  formatJalali,
  MOVEMENT_TYPE_LABELS,
  QUALITY_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PackagePlus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminInventory() {
  const batches = useQuery(api.admin.listBatches, {});
  const movements = useQuery(api.admin.listMovements, {});
  const products = useQuery(api.admin.listAllProducts, {});

  const saveBatch = useMutation(api.admin.saveBatch);
  const removeBatch = useMutation(api.admin.removeBatch);
  const addQualityCheck = useMutation(api.admin.addQualityCheck);
  const adjustStock = useMutation(api.admin.adjustStock);

  const [saving, setSaving] = useState(false);
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchForm, setBatchForm] = useState({
    productId: "",
    batchCode: "",
    quantity: "",
    productionDate: "",
    harvestDate: "",
    packagingDate: "",
    expirationDate: "",
    notes: "",
  });
  const [checkTarget, setCheckTarget] = useState<string | null>(null);
  const [checkForm, setCheckForm] = useState({ status: "passed", notes: "" });
  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    type: "in",
    quantity: "",
    notes: "",
  });

  const openNewBatch = () => {
    setBatchForm({
      productId: products?.[0]?.product._id ?? "",
      batchCode: "",
      quantity: "",
      productionDate: "",
      harvestDate: "",
      packagingDate: "",
      expirationDate: "",
      notes: "",
    });
    setBatchDialog(true);
  };

  const handleSaveBatch = async () => {
    if (!batchForm.productId || !batchForm.batchCode.trim()) {
      toast.error("محصول و کد بچ الزامی است.");
      return;
    }
    setSaving(true);
    try {
      await saveBatch({
        input: {
          productId: batchForm.productId as never,
          batchCode: batchForm.batchCode.trim(),
          quantity: Number(batchForm.quantity) || 0,
          productionDate: batchForm.productionDate || undefined,
          harvestDate: batchForm.harvestDate || undefined,
          packagingDate: batchForm.packagingDate || undefined,
          expirationDate: batchForm.expirationDate || undefined,
          notes: batchForm.notes.trim() || undefined,
        },
      });
      toast.success("بچ ذخیره شد.");
      setBatchDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره بچ ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBatch = async (id: string) => {
    if (!confirm("این بچ حذف شود؟ بچ‌های استفاده‌شده فقط غیرفعال می‌شوند.")) return;
    try {
      await removeBatch({ id: id as never });
      toast.success("بچ حذف شد.");
    } catch (err) {
      toast.warning(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  };

  const handleAddCheck = async () => {
    if (!checkTarget) return;
    setSaving(true);
    try {
      await addQualityCheck({
        batchId: checkTarget as never,
        status: checkForm.status as never,
        notes: checkForm.notes.trim() || undefined,
      });
      toast.success("نتیجه کنترل کیفیت ثبت شد.");
      setCheckTarget(null);
      setCheckForm({ status: "passed", notes: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustForm.productId || !adjustForm.quantity) {
      toast.error("محصول و تعداد الزامی است.");
      return;
    }
    setSaving(true);
    try {
      await adjustStock({
        productId: adjustForm.productId as never,
        type: adjustForm.type as never,
        quantity: Number(adjustForm.quantity),
        notes: adjustForm.notes.trim() || undefined,
      });
      toast.success("موجودی به‌روزرسانی شد.");
      setAdjustForm({ productId: "", type: "in", quantity: "", notes: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">انبار و کیفیت</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          بچ‌های تولید، کنترل کیفیت و گردش موجودی کالاها.
        </p>
      </div>

      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches">بچ‌ها</TabsTrigger>
          <TabsTrigger value="stock">اصلاح موجودی</TabsTrigger>
          <TabsTrigger value="movements">گردش انبار</TabsTrigger>
        </TabsList>

        {/* Batches */}
        <TabsContent value="batches" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={openNewBatch}>
              <Plus className="size-4" /> بچ جدید
            </Button>
          </div>
          {batches === undefined ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              هنوز بچی ثبت نشده است. برای هر محموله تولید، یک بچ با تاریخ‌های
              برداشت و بسته‌بندی بسازید.
            </div>
          ) : (            <div className="grid gap-3 lg:grid-cols-2">
              {batches.map(({ batch, productName }) => (
                <BatchRow
                  key={batch._id}
                  batch={batch}
                  productName={productName}
                  onCheck={() => setCheckTarget(batch._id)}
                  onRemove={() => handleRemoveBatch(batch._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stock adjustments */}
        <TabsContent value="stock" className="mt-4">
          <div className="max-w-xl rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <PackagePlus className="size-4 text-primary" />
              ثبت ورود/خروج کالا
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>محصول *</Label>
                <Select
                  value={adjustForm.productId}
                  onValueChange={(v) =>
                    setAdjustForm({ ...adjustForm, productId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products ?? []).map(({ product: p }) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} (موجودی:{" "}
                        {new Intl.NumberFormat("fa-IR").format(p.stock)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>نوع گردش *</Label>
                <Select
                  value={adjustForm.type}
                  onValueChange={(v) =>
                    setAdjustForm({ ...adjustForm, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>تعداد *</Label>
                <Input
                  dir="ltr"
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, quantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>توضیح</Label>
                <Textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, notes: e.target.value })
                  }
                  placeholder="مثلاً: ورود محموله جدید از باغ"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAdjust} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ثبت گردش
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              «ورود کالا» و «بازگشت» موجودی را افزایش می‌دهند؛ «فروش» کاهش می‌دهد
              و «اصلاح» تعداد را به‌صورت تفاضلی (+ یا −) اعمال می‌کند.
            </p>
          </div>
        </TabsContent>

        {/* Movements */}
        <TabsContent value="movements" className="mt-4">
          {movements === undefined ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              گردشی ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">تاریخ</th>
                    <th className="px-4 py-3 font-medium">محصول</th>
                    <th className="px-4 py-3 font-medium">نوع</th>
                    <th className="px-4 py-3 font-medium">تغییر</th>
                    <th className="px-4 py-3 font-medium">توضیح</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(({ movement, productName }) => (
                    <tr
                      key={movement._id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatJalali(movement._creationTime)}
                      </td>
                      <td className="px-4 py-3">{productName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {MOVEMENT_TYPE_LABELS[movement.type] ?? movement.type}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          movement.quantity >= 0
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        {movement.quantity >= 0 ? "+" : "−"}
                        {new Intl.NumberFormat("fa-IR").format(
                          Math.abs(movement.quantity),
                        )}
                      </td>
                      <td className="max-w-52 truncate px-4 py-3 text-xs text-muted-foreground">
                        {movement.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New batch dialog */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">بچ جدید</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>محصول *</Label>
              <Select
                value={batchForm.productId}
                onValueChange={(v) =>
                  setBatchForm({ ...batchForm, productId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب محصول" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map(({ product: p }) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>کد بچ *</Label>
              <Input
                dir="ltr"
                value={batchForm.batchCode}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, batchCode: e.target.value })
                }
                placeholder="ORG-1404-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>تعداد</Label>
              <Input
                dir="ltr"
                type="number"
                value={batchForm.quantity}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاریخ برداشت</Label>
              <Input
                dir="ltr"
                type="date"
                value={batchForm.harvestDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, harvestDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاریخ بسته‌بندی</Label>
              <Input
                dir="ltr"
                type="date"
                value={batchForm.packagingDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, packagingDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاریخ تولید</Label>
              <Input
                dir="ltr"
                type="date"
                value={batchForm.productionDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, productionDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاریخ انقضا</Label>
              <Input
                dir="ltr"
                type="date"
                value={batchForm.expirationDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, expirationDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>یادداشت</Label>
              <Textarea
                rows={2}
                value={batchForm.notes}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setBatchDialog(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button onClick={handleSaveBatch} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              ذخیره بچ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quality check dialog */}
      <Dialog
        open={checkTarget !== null}
        onOpenChange={(open) => !open && setCheckTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              ثبت کنترل کیفیت
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>نتیجه *</Label>
              <Select
                value={checkForm.status}
                onValueChange={(v) => setCheckForm({ ...checkForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUALITY_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>یادداشت</Label>
              <Textarea
                rows={3}
                value={checkForm.notes}
                onChange={(e) =>
                  setCheckForm({ ...checkForm, notes: e.target.value })
                }
                placeholder="مثلاً: نمونه‌برداری حسی و بازرسی بسته‌بندی انجام شد."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCheckTarget(null)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button onClick={handleAddCheck} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ثبت نتیجه
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One batch card; its quality checks come from a per-batch query. */
function BatchRow({
  batch,
  productName,
  onCheck,
  onRemove,
}: {
  batch: {
    _id: string;
    batchCode: string;
    quantity: number;
    productionDate?: string;
    harvestDate?: string;
    packagingDate?: string;
    expirationDate?: string;
    notes?: string;
  };
  productName: string;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const checks = useQuery(
    api.admin.listQualityChecks,
    { batchId: batch._id as never },
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-mono text-sm font-bold text-accent-foreground">
            {batch.batchCode}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {productName} — موجودی بچ:{" "}
            {new Intl.NumberFormat("fa-IR").format(batch.quantity)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={onCheck}
          >
            <ShieldCheck className="size-3.5" />
            ثبت کنترل کیفیت
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="حذف بچ"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground sm:grid-cols-4">
        <div>
          برداشت:{" "}
          <span className="font-medium text-foreground">
            {batch.harvestDate ? formatIsoDate(batch.harvestDate) : "—"}
          </span>
        </div>
        <div>
          بسته‌بندی:{" "}
          <span className="font-medium text-foreground">
            {batch.packagingDate ? formatIsoDate(batch.packagingDate) : "—"}
          </span>
        </div>
        <div>
          تولید:{" "}
          <span className="font-medium text-foreground">
            {batch.productionDate ? formatIsoDate(batch.productionDate) : "—"}
          </span>
        </div>
        <div>
          انقضا:{" "}
          <span className="font-medium text-foreground">
            {batch.expirationDate ? formatIsoDate(batch.expirationDate) : "—"}
          </span>
        </div>
      </div>
      {batch.notes && (
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          {batch.notes}
        </p>
      )}
      {checks && checks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
          {checks.map((check) => (
            <Badge
              key={check._id}
              variant="outline"
              className={`text-[10px] ${STATUS_BADGE_CLASSES[check.status] ?? ""}`}
            >
              {QUALITY_STATUS_LABELS[check.status]}
              {check.checkedAt ? ` — ${formatJalali(check.checkedAt)}` : ""}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
