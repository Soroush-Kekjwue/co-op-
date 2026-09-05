import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import {
  movementTypeValidator,
  orderStatusValidator,
  paymentStatusValidator,
  qualityStatusValidator,
  ROLES,
} from "./schema";

/**
 * Admin backend. Every admin function calls requireAdmin(ctx) first —
 * authorization is enforced server-side, never only by hiding UI.
 */

const LOW_STOCK_THRESHOLD = 5;
const SHIPPING_FLAT_RATE = 49_000;

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("دسترسی غیرمجاز.");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== ROLES.ADMIN || user.isAnonymous) {
    throw new Error("دسترسی غیرمجاز.");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Bootstrap (the owner is the only person setting up this store)
// ---------------------------------------------------------------------------

/** Public one-time call: the first real account becomes the admin. */
export const bootstrapAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("ابتدا وارد حساب شوید.");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("کاربر یافت نشد.");
    if (user.isAnonymous) throw new Error("حساب مهمان قابل ارتقا نیست.");
    const anyAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .first();
    if (anyAdmin) throw new Error("حساب مدیر از قبل ایجاد شده است.");
    await ctx.db.patch(userId, { role: ROLES.ADMIN });
    return { ok: true };
  },
});

export const bootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .first();
    return { hasAdmin: admin !== null };
  },
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").collect();
    const products = await ctx.db.query("products").collect();
    const users = await ctx.db.query("users").collect();

    const revenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const lowStock = products
      .filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);

    const recentOrders = orders
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 8);
    const recentWithCustomer = await Promise.all(
      recentOrders.map(async (order) => {
        const customer = await ctx.db.get(order.userId);
        return { order, customerName: customer?.name ?? customer?.email ?? "—" };
      }),
    );

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      revenue,
      customers: users.filter((u) => !u.isAnonymous && u.role !== ROLES.ADMIN)
        .length,
      products: products.length,
      lowStock,
      recentOrders: recentWithCustomer,
    };
  },
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const listOrders = query({
  args: { status: v.optional(orderStatusValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orders = args.status
      ? await ctx.db
          .query("orders")
          .withIndex("status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("orders").collect();
    const sorted = orders.sort((a, b) => b._creationTime - a._creationTime);
    const withCustomer = await Promise.all(
      sorted.map(async (order) => {
        const customer = await ctx.db.get(order.userId);
        return { order, customerName: customer?.name ?? customer?.email ?? "—" };
      }),
    );
    return withCustomer;
  },
});

export const getOrderDetail = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const items = await ctx.db
      .query("orderItems")
      .withIndex("orderId", (q) => q.eq("orderId", order._id))
      .collect();
    const customer = await ctx.db.get(order.userId);
    return { order, items, customer };
  },
});

export const updateOrderStatus = mutation({
  args: { orderId: v.id("orders"), status: orderStatusValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("سفارش یافت نشد.");

    if (args.status === "cancelled" && order.status !== "cancelled") {
      // Restock like a customer cancellation.
      const items = await ctx.db
        .query("orderItems")
        .withIndex("orderId", (q) => q.eq("orderId", order._id))
        .collect();
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(product._id, {
            stock: product.stock + item.quantity,
          });
        }
        await ctx.db.insert("inventoryMovements", {
          productId: item.productId,
          type: "return",
          quantity: +item.quantity,
          referenceType: "order_cancel",
          referenceId: order._id,
          notes: `لغو سفارش ${order.orderNumber} توسط مدیر`,
        });
      }
      await ctx.db.patch(args.orderId, {
        status: "cancelled",
        paymentStatus:
          order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
      });
      return;
    }

    if (args.status === "delivered" && order.paymentStatus === "pending") {
      await ctx.db.patch(args.orderId, { status: args.status });
      return;
    }

    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const updatePaymentStatus = mutation({
  args: { orderId: v.id("orders"), paymentStatus: paymentStatusValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("سفارش یافت نشد.");
    await ctx.db.patch(args.orderId, { paymentStatus: args.paymentStatus });
  },
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categoryInput = v.object({
  id: v.optional(v.id("categories")),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  sortOrder: v.number(),
});

export const saveCategory = mutation({
  args: { input: categoryInput },
  handler: async (ctx, { input }) => {
    await requireAdmin(ctx);
    const { id, ...data } = input;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("categories", data);
  },
});

export const removeCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("categoryId", (q) => q.eq("categoryId", id))
      .collect();
    if (products.length > 0) {
      throw new Error(
        "این دسته‌بندی محصول دارد؛ ابتدا محصولات را منتقل یا حذف کنید.",
      );
    }
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

const supplierInput = v.object({
  id: v.optional(v.id("suppliers")),
  name: v.string(),
  slug: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  region: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
});

export const saveSupplier = mutation({
  args: { input: supplierInput },
  handler: async (ctx, { input }) => {
    await requireAdmin(ctx);
    const { id, ...data } = input;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("suppliers", data);
  },
});

export const removeSupplier = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", id))
      .collect();
    if (products.length > 0) {
      // Historical orders must keep working — detach instead of hard delete.
      for (const product of products) {
        await ctx.db.patch(product._id, { supplierId: undefined });
      }
    }
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const productInput = v.object({
  id: v.optional(v.id("products")),
  categoryId: v.id("categories"),
  name: v.string(),
  slug: v.string(),
  sku: v.string(),
  description: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  price: v.number(),
  comparePrice: v.optional(v.number()),
  unit: v.string(),
  weight: v.optional(v.number()),
  stock: v.number(),
  isActive: v.boolean(),
  isFeatured: v.boolean(),
  isSeasonal: v.boolean(),
  origin: v.string(),
  season: v.optional(v.string()),
  storageConditions: v.optional(v.string()),
  producerDescription: v.optional(v.string()),
  supplierId: v.optional(v.id("suppliers")),
});

export const saveProduct = mutation({
  args: { input: productInput },
  handler: async (ctx, { input }) => {
    await requireAdmin(ctx);
    const { id, ...data } = input;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("products", data);
  },
});

export const toggleProductActive = mutation({
  args: { id: v.id("products"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isActive });
  },
});

export const removeProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    // Guard: never break historical orders. A sold product is deactivated.
    const sold = await ctx.db
      .query("orderItems")
      .filter((q) => q.eq(q.field("productId"), id))
      .first();
    if (sold) {
      await ctx.db.patch(id, { isActive: false });
      throw new Error(
        "این محصول در سفارش‌های قبلی ثبت شده و حذف نشد؛ به‌جای حذف، غیرفعال شد.",
      );
    }
    const batches = await ctx.db
      .query("batches")
      .withIndex("productId", (q) => q.eq("productId", id))
      .collect();
    for (const batch of batches) {
      await ctx.db.delete(batch._id);
    }
    await ctx.db.delete(id);
  },
});

// ---------------------------------------------------------------------------
// Batches & quality
// ---------------------------------------------------------------------------

const batchInput = v.object({
  id: v.optional(v.id("batches")),
  productId: v.id("products"),
  supplierId: v.optional(v.id("suppliers")),
  batchCode: v.string(),
  quantity: v.number(),
  productionDate: v.optional(v.string()),
  harvestDate: v.optional(v.string()),
  packagingDate: v.optional(v.string()),
  expirationDate: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const saveBatch = mutation({
  args: { input: batchInput },
  handler: async (ctx, { input }) => {
    await requireAdmin(ctx);
    const { id, ...data } = input;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("batches", { ...data, isActive: true });
  },
});

export const removeBatch = mutation({
  args: { id: v.id("batches") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const used = await ctx.db
      .query("inventoryMovements")
      .filter((q) => q.eq(q.field("batchId"), id))
      .first();
    if (used) {
      await ctx.db.patch(id, { isActive: false });
      throw new Error("این بچ در گردش موجودی استفاده شده؛ غیرفعال شد.");
    }
    const checks = await ctx.db
      .query("qualityChecks")
      .withIndex("batchId", (q) => q.eq("batchId", id))
      .collect();
    for (const check of checks) {
      await ctx.db.delete(check._id);
    }
    await ctx.db.delete(id);
  },
});

export const addQualityCheck = mutation({
  args: {
    batchId: v.id("batches"),
    status: qualityStatusValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.insert("qualityChecks", {
      batchId: args.batchId,
      status: args.status,
      checkedBy: admin.name ?? admin.email ?? "مدیر",
      checkedAt: Date.now(),
      notes: args.notes,
    });
  },
});

export const listQualityChecks = query({
  args: { batchId: v.optional(v.id("batches")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.batchId) {
      return await ctx.db
        .query("qualityChecks")
        .withIndex("batchId", (q) => q.eq("batchId", args.batchId!))
        .collect();
    }
    return await ctx.db.query("qualityChecks").collect();
  },
});

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const listMovements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const movements = await ctx.db
      .query("inventoryMovements")
      .order("desc")
      .take(100);
    const withProduct = await Promise.all(
      movements.map(async (movement) => {
        const product = await ctx.db.get(movement.productId);
        return { movement, productName: product?.name ?? "—" };
      }),
    );
    return withProduct;
  },
});

export const adjustStock = mutation({
  args: {
    productId: v.id("products"),
    type: movementTypeValidator,
    quantity: v.number(),
    batchId: v.optional(v.id("batches")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("محصول یافت نشد.");
    if (args.quantity <= 0 && args.type !== "adjustment") {
      throw new Error("تعداد باید بزرگ‌تر از صفر باشد.");
    }
    const delta =
      args.type === "in" || args.type === "return"
        ? Math.abs(args.quantity)
        : args.type === "sale"
          ? -Math.abs(args.quantity)
          : args.quantity; // adjustment is a signed delta

    const newStock = product.stock + delta;
    if (newStock < 0) {
      throw new Error("موجودی نمی‌تواند منفی شود.");
    }
    await ctx.db.patch(product._id, { stock: newStock });
    await ctx.db.insert("inventoryMovements", {
      productId: args.productId,
      batchId: args.batchId,
      type: args.type,
      quantity: delta,
      referenceType: "admin",
      notes: args.notes ?? "اصلاح موجودی توسط مدیر",
      createdBy: admin._id,
    });
  },
});

// ---------------------------------------------------------------------------
// Catalog listings (admin view: includes inactive rows)
// ---------------------------------------------------------------------------

export const listAllProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").collect();
    const sorted = products.sort((a, b) => b._creationTime - a._creationTime);
    const withCategory = await Promise.all(
      sorted.map(async (p) => {
        const category = await ctx.db.get(p.categoryId);
        return { product: p, categoryName: category?.name ?? "—" };
      }),
    );
    return withCategory;
  },
});

export const listAllCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("categories")
      .withIndex("sortOrder")
      .order("asc")
      .collect();
  },
});

export const listAllSuppliers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("suppliers").collect();
  },
});

export const listBatches = query({
  args: { productId: v.optional(v.id("products")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const batches = args.productId
      ? await ctx.db
          .query("batches")
          .withIndex("productId", (q) => q.eq("productId", args.productId!))
          .collect()
      : await ctx.db.query("batches").collect();
    const withProduct = await Promise.all(
      batches.map(async (b) => {
        const product = await ctx.db.get(b.productId);
        return { batch: b, productName: product?.name ?? "—" };
      }),
    );
    return withProduct.sort(
      (a, b) => b.batch._creationTime - a.batch._creationTime,
    );
  },
});

// ---------------------------------------------------------------------------
// Demo seed (admin-only) — sample cooperative catalog
// ---------------------------------------------------------------------------

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("categories").first();
    if (existing) throw new Error("داده‌های نمونه قبلاً ایجاد شده‌اند.");

    const cat = async (name: string, slug: string, sortOrder: number) =>
      await ctx.db.insert("categories", { name, slug, sortOrder });

    const citrusId = await cat("مرکبات", "citrus", 1);
    const grainsId = await cat("غلات و حبوبات", "grains", 2);
    const spicesId = await cat("ادویه و زعفران", "spices", 3);
    const oilId = await cat("روغن و زیتون", "oil", 4);
    const sweetsId = await cat("شیرینی طبیعی", "sweets", 5);
    const nutsId = await cat("خشکبار", "nuts", 6);

    const supplierOrange = await ctx.db.insert("suppliers", {
      name: "باغ تعاونی هم‌بن",
      slug: "hem-ben-grove",
      region: "مازندران، سوادکوه",
      description:
        "باغ پرتقال متعلق به تعاونی هم‌بن؛ برداشت دستی و ارسال مستقیم از باغ.",
      isActive: true,
    });
    const supplierRice = await ctx.db.insert("suppliers", {
      name: "شالیکاری‌های گیلان",
      slug: "gilan-rice",
      region: "گیلان، فومن",
      description: "برنج محلی تازه، شالیزارهای خانوادگی.",
      isActive: true,
    });
    const supplierHoney = await ctx.db.insert("suppliers", {
      name: "زنبورستان کوهستان",
      slug: "mountain-apiary",
      region: "سمنان، شاهرود",
      description: "عسل طبیعی کوهستان با آنالیز گل‌شناسی.",
      isActive: true,
    });

    const product = async (data: {
      categoryId: typeof citrusId;
      name: string;
      slug: string;
      sku: string;
      price: number;
      unit: string;
      stock: number;
      origin: string;
      shortDescription: string;
      description: string;
      isFeatured?: boolean;
      isSeasonal?: boolean;
      season?: string;
      comparePrice?: number;
      supplierId?: typeof supplierOrange;
      storageConditions?: string;
    }) =>
      await ctx.db.insert("products", {
        isActive: true,
        isFeatured: false,
        isSeasonal: false,
        ...data,
      });

    const orange = await product({
      categoryId: citrusId,
      name: "پرتقال تامسون باغ خودمان",
      slug: "thomson-orange",
      sku: "ORG-TMS-1",
      price: 68_000,
      comparePrice: 82_000,
      unit: "کیلوگرم",
      stock: 240,
      origin: "مازندران، سوادکوه",
      season: "آذر تا اسفند",
      shortDescription: "برداشت دستی از باغ تعاونی، بدون سردخانه",
      description:
        "پرتقال تامسون باغ متعلق به تعاونی در دامنه‌های سوادکوه. برداشت دستی، بسته‌بندی همان روز و ارسال مستقیم. آب‌ و شیرینی طبیعی محصول بدون تیمار نگهدارنده.",
      isFeatured: true,
      isSeasonal: true,
      supplierId: supplierOrange,
      storageConditions: "خنک و سایه؛ تا دو هفته در دمای اتاق",
    });

    await product({
      categoryId: grainsId,
      name: "برنج علوی محلی",
      slug: "alavi-rice",
      sku: "RCE-ALV-1",
      price: 320_000,
      unit: "۵ کیلوگرم",
      stock: 60,
      origin: "گیلان، فومن",
      shortDescription: "برنج معطر محلی، برداشت امسال",
      description:
        "برنج علوی شالیزارهای خانوادگی فومن؛ خشک‌شده در سایه و بسته‌بندی ۵ کیلویی بدون برنجکاری.",
      isFeatured: true,
      supplierId: supplierRice,
      storageConditions: "خشک و خنک؛ دور از نور مستقیم",
    });

    await product({
      categoryId: spicesId,
      name: "زعفران سرگل قائنات",
      slug: "sargol-saffron",
      sku: "SAF-SRG-1",
      price: 1_450_000,
      unit: "۴.۶ گرم (مثقال)",
      stock: 35,
      origin: "خراسان جنوبی، قائن",
      shortDescription: "سرگل خالص با رنگ‌دهی بالای ۲۴۰",
      description:
        "زعفران سرگل قائنات، دست‌چین و خشک‌شده در سایه. هر بسته با بچ ثبت‌شده و تاریخ برداشت.",
      isFeatured: true,
    });

    await product({
      categoryId: oilId,
      name: "روغن زیتون فرابکر رودبار",
      slug: "extra-virgin-olive-oil",
      sku: "OLI-EVO-1",
      price: 495_000,
      unit: "نیم‌لیتر",
      stock: 42,
      origin: "گیلان، رودبار",
      shortDescription: "پرس سرد، اسیدیته زیر ۰٫۸",
      description:
        "روغن زیتون فرابکر از زیتون رودبار با پرس سرد؛ بوتل شیشه‌ای تیره برای حفظ کیفیت.",
      supplierId: supplierHoney,
    });

    await product({
      categoryId: oilId,
      name: "زیتون پرورده شمال",
      slug: "marinated-olives",
      sku: "OLI-PRD-1",
      price: 145_000,
      unit: "شیشه ۷۰۰ گرمی",
      stock: 30,
      origin: "گیلان، رودسر",
      shortDescription: "با گردو و رب انار خانگی",
      description: "زیتون پرورده شمالی به روش محلی، بدون نگهدارنده صنعتی.",
      isSeasonal: true,
    });

    await product({
      categoryId: sweetsId,
      name: "رب انار طبیعی",
      slug: "pomegranate-paste",
      sku: "PMP-PST-1",
      price: 185_000,
      unit: "شیشه ۷۵۰ گرمی",
      stock: 25,
      origin: "یزد، اردکان",
      shortDescription: "صد درصد انار، بدون شکر افزوده",
      description:
        "رب انار غلیظ پخته‌شده از انارهای باغ‌های اردکان؛ ترش و طبیعی.",
      isFeatured: true,
    });

    await product({
      categoryId: sweetsId,
      name: "عسل کوهی گون",
      slug: "gavan-honey",
      sku: "HNY-GVN-1",
      price: 780_000,
      unit: "کیلوگرم",
      stock: 18,
      origin: "سمنان، شاهرود",
      shortDescription: "برداشت تابستان، آنالیز گل‌شناسی",
      description:
        "عسل گون کوهستان شاهرود از زنبورستان تأییدشده تعاونی؛ درج تاریخ برداشت روی هر شیشه.",
      isSeasonal: true,
      supplierId: supplierHoney,
    });

    await product({
      categoryId: sweetsId,
      name: "خرمای مضافتی بم",
      slug: "mazafati-dates",
      sku: "DAT-MZF-1",
      price: 210_000,
      unit: "کیلوگرم",
      stock: 55,
      origin: "کرمان، بم",
      shortDescription: "تازه و مرطوب، مستقیم از نخلستان",
      description: "خرمای مضافتی درجه یک بم؛ برداشت پاییز و ارسال سریع.",
    });

    await product({
      categoryId: nutsId,
      name: "گردوی تازه تویسرکان",
      slug: "tuysarkan-walnut",
      sku: "NUT-WLN-1",
      price: 890_000,
      unit: "کیلوگرم",
      stock: 20,
      origin: "همدان، تویسرکان",
      shortDescription: "مغز روشن، برداشت امسال",
      description: "گردوی خشک تویسرکان با مغز روشن و طعم ملایم.",
    });

    await product({
      categoryId: nutsId,
      name: "بادام درختی مامایی",
      slug: "mamai-almond",
      sku: "NUT-ALM-1",
      price: 1_150_000,
      unit: "کیلوگرم",
      stock: 12,
      origin: "چهارمحال، شهرکرد",
      shortDescription: "بادام خشک درختی، بو داده نشده",
      description: "بادام مامایی شهرکرد؛ ترد و معطر، مناسب نگهداری بلندمدت.",
    });

    await product({
      categoryId: grainsId,
      name: "عدس پلویی بافت",
      slug: "baft-lentil",
      sku: "LNT-BFT-1",
      price: 165_000,
      unit: "کیلوگرم",
      stock: 48,
      origin: "کرمانشاه، بافت",
      shortDescription: "درشت، تمیز و یکدست",
      description: "عدس پلویی بافت با دانه‌های درشت و پخت یکنواخت.",
    });

    await product({
      categoryId: citrusId,
      name: "لیمو شیرین جنوب",
      slug: "sweet-lime",
      sku: "LIM-SWT-1",
      price: 95_000,
      unit: "کیلوگرم",
      stock: 4,
      origin: "هرمزگان، میناب",
      shortDescription: "آبدار و معطر؛ موجودی محدود فصل",
      description: "لیمو شیرین میناب؛ فصل کوتاه برداشت و موجودی محدود.",
      isSeasonal: true,
    });

    // Batches with harvest/packaging dates + quality checks for the passport.
    const batchDefs = [
      {
        productId: orange,
        batchCode: "ORG-1404-001",
        quantity: 240,
        harvestDate: "2026-08-20",
        productionDate: "2026-08-21",
        packagingDate: "2026-08-22",
        check: "passed" as const,
      },
      {
        productId: orange,
        batchCode: "ORG-1404-002",
        quantity: 0,
        harvestDate: "2026-08-27",
        productionDate: "2026-08-27",
        packagingDate: "2026-08-28",
        check: "pending" as const,
      },
    ];
    for (const def of batchDefs) {
      const batchId = await ctx.db.insert("batches", {
        productId: def.productId,
        supplierId: supplierOrange,
        batchCode: def.batchCode,
        quantity: def.quantity,
        productionDate: def.productionDate,
        harvestDate: def.harvestDate,
        packagingDate: def.packagingDate,
        notes: "باغ تعاونی هم‌بن؛ برداشت دستی",
        isActive: true,
      });
      await ctx.db.insert("qualityChecks", {
        batchId,
        status: def.check,
        checkedBy: "مدیر کیفیت تعاونی",
        checkedAt: Date.now(),
        notes:
          def.check === "passed"
            ? "نمونه‌برداری شیمیایی و حسی: تأیید شد"
            : "در انتظار بررسی حسی",
      });
    }
    await ctx.db.insert("inventoryMovements", {
      productId: orange,
      type: "in",
      quantity: 240,
      referenceType: "seed",
      notes: "ورود اولیه بچ ORG-1404-001 از باغ تعاونی هم‌بن",
    });

    void grainsId;
    void spicesId;
    void nutsId;

    return { ok: true };
  },
});
