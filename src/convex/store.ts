import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

/** Public catalog queries — no auth required. */

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("sortOrder")
      .order("asc")
      .collect();
  },
});

export const listProducts = query({
  args: {
    categorySlug: v.optional(v.string()),
    search: v.optional(v.string()),
    availability: v.optional(v.union(v.literal("all"), v.literal("in_stock"))),
    seasonalOnly: v.optional(v.boolean()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(
      v.union(v.literal("newest"), v.literal("price_asc"), v.literal("price_desc")),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let products;

    if (args.categorySlug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("slug", (q) => q.eq("slug", args.categorySlug!))
        .unique();
      if (!category) {
        return { page: [], isDone: true, continueCursor: "" };
      }
      products = await ctx.db
        .query("products")
        .withIndex("categoryId", (q) => q.eq("categoryId", category._id))
        .collect();
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("isActive", (q) => q.eq("isActive", true))
        .collect();
    }

    let filtered = products.filter((p) => p.isActive);
    if (args.search) {
      const s = args.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          p.shortDescription?.toLowerCase().includes(s),
      );
    }
    if (args.availability === "in_stock") {
      filtered = filtered.filter((p) => p.stock > 0);
    }
    if (args.seasonalOnly) {
      filtered = filtered.filter((p) => p.isSeasonal);
    }
    if (args.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= args.maxPrice!);
    }
    const sort = args.sort ?? "newest";
    filtered.sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return b._creationTime - a._creationTime;
    });

    // Client-side pagination over the filtered list.
    const page = filtered.slice(0, 12);
    const isDone = filtered.length <= 12;
    return {
      page,
      isDone,
      continueCursor: isDone ? "" : String(filtered.length),
    };
  },
});

export const getProductBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!product || !product.isActive) return null;

    const category = await ctx.db.get(product.categoryId);
    const supplier = product.supplierId
      ? await ctx.db.get(product.supplierId)
      : null;

    // Product passport: active batches + latest quality check per batch.
    const batches = (
      await ctx.db
        .query("batches")
        .withIndex("productId", (q) => q.eq("productId", product._id))
        .collect()
    ).filter((b) => b.isActive);

    const passport = await Promise.all(
      batches.map(async (batch) => {
        const checks = await ctx.db
          .query("qualityChecks")
          .withIndex("batchId", (q) => q.eq("batchId", batch._id))
          .collect();
        const latest =
          checks.sort((a, b) => (b.checkedAt ?? 0) - (a.checkedAt ?? 0))[0] ??
          null;
        return { batch, latestCheck: latest };
      }),
    );

    return { product, category, supplier, passport };
  },
});

/** Fetch products for cart display by ids (skips inactive/missing ones). */
export const getProductsByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return products.filter(
      (p): p is NonNullable<typeof p> => p !== null && p.isActive,
    );
  },
});

export const getFeaturedProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();
    return {
      featured: products.filter((p) => p.isFeatured).slice(0, 4),
      seasonal: products.filter((p) => p.isSeasonal).slice(0, 4),
    };
  },
});

/** Homepage discovery band: the freshest active products ("این هفته در تعاونی"). */
export const getFreshArrivals = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();
    return products
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 4);
  },
});
