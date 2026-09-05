import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { formatTomanShort } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductForm {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string;
  unit: string;
  weight: string;
  stock: string;
  isActive: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
  origin: string;
  season: string;
  storageConditions: string;
  producerDescription: string;
  supplierId: string;
}

const EMPTY_PRODUCT: ProductForm = {
  categoryId: "",
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  price: "",
  comparePrice: "",
  unit: "کیلوگرم",
  weight: "",
  stock: "",
  isActive: true,
  isFeatured: false,
  isSeasonal: false,
  origin: "",
  season: "",
  storageConditions: "",
  producerDescription: "",
  supplierId: "",
};

export default function AdminProducts() {
  const products = useQuery(api.admin.listAllProducts, {});
  const categories = useQuery(api.admin.listAllCategories, {});
  const suppliers = useQuery(api.admin.listAllSuppliers, {});

  const saveProduct = useMutation(api.admin.saveProduct);
  const toggleProductActive = useMutation(api.admin.toggleProductActive);
  const removeProduct = useMutation(api.admin.removeProduct);
  const saveCategory = useMutation(api.admin.saveCategory);
  const removeCategory = useMutation(api.admin.removeCategory);
  const saveSupplier = useMutation(api.admin.saveSupplier);
  const removeSupplier = useMutation(api.admin.removeSupplier);

  const [productDialog, setProductDialog] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    slug: "",
    sortOrder: "0",
    description: "",
  });
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: "",
    name: "",
    slug: "",
    region: "",
    description: "",
    isActive: true,
  });

  const openNewProduct = () => {
    setForm({
      ...EMPTY_PRODUCT,
      categoryId: categories?.[0]?._id ?? "",
      supplierId: "none",
    });
    setProductDialog(true);
  };

  const openEditProduct = (p: NonNullable<
    NonNullable<typeof products>[number]["product"]
  >) => {
    setForm({
      id: p._id,
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description ?? "",
      shortDescription: p.shortDescription ?? "",
      price: String(p.price),
      comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      unit: p.unit,
      weight: p.weight ? String(p.weight) : "",
      stock: String(p.stock),
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isSeasonal: p.isSeasonal,
      origin: p.origin,
      season: p.season ?? "",
      storageConditions: p.storageConditions ?? "",
      producerDescription: p.producerDescription ?? "",
      supplierId: p.supplierId ?? "none",
    });
    setProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.sku.trim() || !form.categoryId) {
      toast.error("نام، شناسه، کد کالا و دسته‌بندی الزامی است.");
      return;
    }
    setSaving(true);
    try {
      await saveProduct({
        input: {
          id: form.id as never,
          categoryId: form.categoryId as never,
          name: form.name.trim(),
          slug: form.slug.trim(),
          sku: form.sku.trim(),
          description: form.description.trim() || undefined,
          shortDescription: form.shortDescription.trim() || undefined,
          price: Number(form.price) || 0,
          comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
          unit: form.unit.trim() || "عدد",
          weight: form.weight ? Number(form.weight) : undefined,
          stock: Number(form.stock) || 0,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          isSeasonal: form.isSeasonal,
          origin: form.origin.trim() || "نامشخص",
          season: form.season.trim() || undefined,
          storageConditions: form.storageConditions.trim() || undefined,
          producerDescription: form.producerDescription.trim() || undefined,
          supplierId:
            form.supplierId && form.supplierId !== "none"
              ? (form.supplierId as never)
              : undefined,
        },
      });
      toast.success("محصول ذخیره شد.");
      setProductDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره محصول ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleProductActive({ id: id as never, isActive });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت.");
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (!confirm("این محصول حذف شود؟ محصولات فروش‌رفته فقط غیرفعال می‌شوند.")) return;
    try {
      await removeProduct({ id: id as never });
      toast.success("محصول حذف شد.");
    } catch (err) {
      // Server deactivates instead of deleting sold products — surface that.
      toast.warning(
        err instanceof Error ? err.message : "حذف محصول ناموفق بود.",
      );
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      toast.error("نام و شناسه دسته الزامی است.");
      return;
    }
    setSaving(true);
    try {
      await saveCategory({
        input: {
          id: categoryForm.id ? (categoryForm.id as never) : undefined,
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim(),
          sortOrder: Number(categoryForm.sortOrder) || 0,
          description: categoryForm.description.trim() || undefined,
        },
      });
      toast.success("دسته‌بندی ذخیره شد.");
      setCategoryDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!confirm("این دسته‌بندی حذف شود؟")) return;
    try {
      await removeCategory({ id: id as never });
      toast.success("دسته‌بندی حذف شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim() || !supplierForm.slug.trim() || !supplierForm.region.trim()) {
      toast.error("نام، شناسه و منطقه تولیدکننده الزامی است.");
      return;
    }
    setSaving(true);
    try {
      await saveSupplier({
        input: {
          id: supplierForm.id ? (supplierForm.id as never) : undefined,
          name: supplierForm.name.trim(),
          slug: supplierForm.slug.trim(),
          region: supplierForm.region.trim(),
          description: supplierForm.description.trim() || undefined,
          isActive: supplierForm.isActive,
        },
      });
      toast.success("تولیدکننده ذخیره شد.");
      setSupplierDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSupplier = async (id: string) => {
    if (!confirm("این تولیدکننده حذف شود؟ محصولات آن بدون تولیدکننده می‌شوند.")) return;
    try {
      await removeSupplier({ id: id as never });
      toast.success("تولیدکننده حذف شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">محصولات و دسته‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مدیریت کالاها، دسته‌بندی‌ها و تولیدکنندگان هم‌بن.
        </p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">محصولات</TabsTrigger>
          <TabsTrigger value="categories">دسته‌بندی‌ها</TabsTrigger>
          <TabsTrigger value="suppliers">تولیدکنندگان</TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={openNewProduct}>
              <Plus className="size-4" /> محصول جدید
            </Button>
          </div>
          {products === undefined ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              هنوز محصولی ثبت نشده است. با «داده‌های نمونه» در نمای کلی شروع کنید
              یا اولین محصول را بسازید.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">محصول</th>
                    <th className="px-4 py-3 font-medium">دسته</th>
                    <th className="px-4 py-3 font-medium">قیمت</th>
                    <th className="px-4 py-3 font-medium">موجودی</th>
                    <th className="px-4 py-3 font-medium">وضعیت</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(({ product: p, categoryName }) => (
                    <tr
                      key={p._id}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        <div dir="ltr" className="text-right font-mono text-[11px] text-muted-foreground">
                          {p.sku}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {categoryName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatTomanShort(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        {new Intl.NumberFormat("fa-IR").format(p.stock)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Switch
                            checked={p.isActive}
                            onCheckedChange={(v) => handleToggle(p._id, v)}
                            aria-label="فعال/غیرفعال"
                          />
                          {p.isFeatured && (
                            <Badge variant="outline" className="text-[10px]">
                              منتخب
                            </Badge>
                          )}
                          {p.isSeasonal && (
                            <Badge variant="outline" className="text-[10px]">
                              فصلی
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditProduct(p)}
                            aria-label="ویرایش"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveProduct(p._id)}
                            aria-label="حذف"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setCategoryForm({ id: "", name: "", slug: "", sortOrder: "0", description: "" });
                setCategoryDialog(true);
              }}
            >
              <Plus className="size-4" /> دسته جدید
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories === undefined ? (
              <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            ) : (
              categories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div dir="ltr" className="text-right font-mono text-[11px] text-muted-foreground">
                      {c.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setCategoryForm({
                          id: c._id,
                          name: c.name,
                          slug: c.slug,
                          sortOrder: String(c.sortOrder),
                          description: c.description ?? "",
                        });
                        setCategoryDialog(true);
                      }}
                      aria-label="ویرایش"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveCategory(c._id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Suppliers */}
        <TabsContent value="suppliers" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setSupplierForm({ id: "", name: "", slug: "", region: "", description: "", isActive: true });
                setSupplierDialog(true);
              }}
            >
              <Plus className="size-4" /> تولیدکننده جدید
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {suppliers === undefined ? (
              <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                هنوز تولیدکننده‌ای ثبت نشده است.
              </p>
            ) : (
              suppliers.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Store className="size-4 text-primary" />
                      {s.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.region}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setSupplierForm({
                          id: s._id,
                          name: s.name,
                          slug: s.slug,
                          region: s.region,
                          description: s.description ?? "",
                          isActive: s.isActive,
                        });
                        setSupplierDialog(true);
                      }}
                      aria-label="ویرایش"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveSupplier(s._id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {form.id ? "ویرایش محصول" : "محصول جدید"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>نام محصول *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>شناسه (slug) *</Label>
              <Input
                dir="ltr"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="thomson-orange"
              />
            </div>
            <div className="space-y-1.5">
              <Label>کد کالا (SKU) *</Label>
              <Input
                dir="ltr"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="ORG-TMS-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>دسته‌بندی *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>قیمت (تومان) *</Label>
              <Input
                dir="ltr"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>قیمت پیش از تخفیف</Label>
              <Input
                dir="ltr"
                type="number"
                value={form.comparePrice}
                onChange={(e) =>
                  setForm({ ...form, comparePrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>واحد</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="کیلوگرم، بسته، شیشه…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>وزن (گرم)</Label>
              <Input
                dir="ltr"
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>موجودی *</Label>
              <Input
                dir="ltr"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>تولیدکننده</Label>
              <Select
                value={form.supplierId || "none"}
                onValueChange={(v) => setForm({ ...form, supplierId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون تولیدکننده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تولیدکننده</SelectItem>
                  {(suppliers ?? []).map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>مبدأ *</Label>
              <Input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="مازندران، سوادکوه"
              />
            </div>
            <div className="space-y-1.5">
              <Label>فصل تولید</Label>
              <Input
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                placeholder="آذر تا اسفند"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>توضیح کوتاه</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>توضیحات کامل</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>شرایط نگهداری</Label>
              <Input
                value={form.storageConditions}
                onChange={(e) =>
                  setForm({ ...form, storageConditions: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>توضیح تولیدکننده</Label>
              <Input
                value={form.producerDescription}
                onChange={(e) =>
                  setForm({ ...form, producerDescription: e.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                فعال (قابل نمایش)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                />
                منتخب صفحه اصلی
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isSeasonal}
                  onCheckedChange={(v) => setForm({ ...form, isSeasonal: v })}
                />
                محصول فصلی
              </label>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setProductDialog(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              ذخیره محصول
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {categoryForm.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>نام *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>شناسه (slug) *</Label>
              <Input
                dir="ltr"
                value={categoryForm.slug}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, slug: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>ترتیب نمایش</Label>
              <Input
                dir="ltr"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, sortOrder: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>توضیح</Label>
              <Textarea
                rows={2}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCategoryDialog(false)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button onClick={handleSaveCategory} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ذخیره
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier dialog */}
      <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {supplierForm.id ? "ویرایش تولیدکننده" : "تولیدکننده جدید"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>نام *</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>شناسه (slug) *</Label>
              <Input
                dir="ltr"
                value={supplierForm.slug}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, slug: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>منطقه *</Label>
              <Input
                value={supplierForm.region}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, region: e.target.value })
                }
                placeholder="مازندران، سوادکوه"
              />
            </div>
            <div className="space-y-1.5">
              <Label>توضیح</Label>
              <Textarea
                rows={2}
                value={supplierForm.description}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={supplierForm.isActive}
                onCheckedChange={(v) =>
                  setSupplierForm({ ...supplierForm, isActive: v })
                }
              />
              فعال
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSupplierDialog(false)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button onClick={handleSaveSupplier} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ذخیره
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
