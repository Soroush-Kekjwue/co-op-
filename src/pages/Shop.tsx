import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { api } from "@/convex/_generated/api";
import { toPersianDigits } from "@/lib/format";
import { useQuery } from "convex/react";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
] as const;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const availability = searchParams.get("availability") === "in_stock";
  const seasonalOnly = searchParams.get("filter") === "seasonal";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = (searchParams.get("sort") ?? "newest") as
    | "newest"
    | "price_asc"
    | "price_desc";
  const [showFilters, setShowFilters] = useState(false);

  const categories = useQuery(api.store.listCategories, {});
  const result = useQuery(api.store.listProducts, {
    categorySlug: category,
    search,
    availability: availability ? ("in_stock" as const) : undefined,
    seasonalOnly,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    paginationOpts: { numItems: 12, cursor: null },
  });
  const products = result?.page ?? [];

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {search
                ? `جستجو: «${search}»`
                : seasonalOnly
                  ? "محصولات فصلی"
                  : "فروشگاه"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result === undefined
                ? "در حال بارگذاری…"
                : `${toPersianDigits(products.length)} محصول`}
            </p>
            {(category || search || availability || seasonalOnly || minPrice || maxPrice) && (
              <button
                type="button"
                onClick={() => setSearchParams(new URLSearchParams())}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <X className="size-3" /> حذف همه فیلترها
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 lg:hidden"
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="size-4" /> فیلترها
            </Button>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className={showFilters ? "block" : "hidden lg:block"}>
            <div className="paper-grain space-y-6 rounded-lg border border-border bg-card p-5">
              <div>
                <h3 className="mb-3 font-display text-base font-bold">
                  دسته‌بندی
                </h3>
                <div className="space-y-1.5 text-sm">
                  <button
                    type="button"
                    onClick={() => setParam("category", null)}
                    className={`block w-full rounded px-2 py-1 text-right hover:bg-secondary ${!category ? "font-medium text-primary" : ""}`}
                  >
                    همه دسته‌ها
                  </button>
                  {categories?.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => setParam("category", c.slug)}
                      className={`block w-full rounded px-2 py-1 text-right hover:bg-secondary ${category === c.slug ? "font-medium text-primary" : ""}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <h3 className="font-display text-base font-bold">ویژگی‌ها</h3>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(e) =>
                      setParam("availability", e.target.checked ? "in_stock" : null)
                    }
                    className="size-4 accent-primary"
                  />
                  فقط کالاهای موجود
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={seasonalOnly}
                    onChange={(e) =>
                      setParam("filter", e.target.checked ? "seasonal" : null)
                    }
                    className="size-4 accent-primary"
                  />
                  محصولات فصلی
                </label>
              </div>

              <div>
                <h3 className="mb-3 font-display text-base font-bold">
                  محدوده قیمت (تومان)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="از"
                    value={minPrice ?? ""}
                    onChange={(e) => setParam("minPrice", e.target.value || null)}
                    className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm"
                  />
                  <span className="text-muted-foreground">—</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="تا"
                    value={maxPrice ?? ""}
                    onChange={(e) => setParam("maxPrice", e.target.value || null)}
                    className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div>
            {result === undefined ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-lg bg-secondary/40"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="paper-grain rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <Search className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="font-display text-lg font-bold">
                  محصولی یافت نشد
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
