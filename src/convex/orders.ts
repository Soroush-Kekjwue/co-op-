import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from "./shared";

/**
 * Customer order flows.
 * Business rules enforced here:
 *  - inactive products cannot be purchased
 *  - checkout fails when stock is insufficient (re-checked at mutation time)
 *  - order items snapshot product name & price
 *  - each item logs an inventory movement ("sale")
 */


export const checkout = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    address: v.object({
      fullName: v.string(),
      phone: v.string(),
      province: v.string(),
      city: v.string(),
      postalCode: v.string(),
      line: v.string(),
    }),
    paymentMethod: v.union(v.literal("on_delivery"), v.literal("bank_transfer")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("برای ثبت سفارش باید وارد حساب خود شوید.");
    }
    if (args.items.length === 0) {
      throw new Error("سبد خرید خالی است.");
    }

    // Validate stock and build item snapshots first — fail before writing anything.
    const snapshots = [];
    for (const item of args.items) {
      if (item.quantity < 1) {
        throw new Error("تعداد باید حداقل ۱ باشد.");
      }
      const product = await ctx.db.get(item.productId);
      if (!product || !product.isActive) {
        throw new Error(`محصول «${product?.name ?? "نامشخص"}» قابل خرید نیست.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `موجودی «${product.name}» کافی نیست (موجودی: ${product.stock}).`,
        );
      }
      snapshots.push({
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      });
    }

    const subtotal = snapshots.reduce((sum, s) => sum + s.subtotal, 0);
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    const total = subtotal + shippingCost;
    const orderNumber = `CO-${Date.now().toString(36).toUpperCase()}`;

    const orderId = await ctx.db.insert("orders", {
      userId,
      orderNumber,
      status: "pending",
      subtotal,
      shippingCost,
      discount: 0,
      total,
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      recipientName: args.address.fullName,
      recipientPhone: args.address.phone,
      shippingAddress: [
        args.address.province,
        args.address.city,
        args.address.line,
        `کدپستی: ${args.address.postalCode}`,
      ].join("، "),
      notes: args.notes,
    });

    for (const s of snapshots) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: s.product._id,
        productNameSnapshot: s.product.name,
        unitPrice: s.unitPrice,
        quantity: s.quantity,
        subtotal: s.subtotal,
      });
      await ctx.db.patch(s.product._id, { stock: s.product.stock - s.quantity });
      await ctx.db.insert("inventoryMovements", {
        productId: s.product._id,
        type: "sale",
        quantity: -s.quantity,
        referenceType: "order",
        referenceId: orderId,
        notes: `فروش سفارش ${orderNumber}`,
        createdBy: userId,
      });
    }

    return { orderId, orderNumber, total };
  },
});

/** Orders of the signed-in customer, newest first. */
export const myOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("orders")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Order detail — only the owner can read it. */
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) return null;
    const items = await ctx.db
      .query("orderItems")
      .withIndex("orderId", (q) => q.eq("orderId", order._id))
      .collect();
    return { order, items };
  },
});

/** Customer cancels a pending order; stock is restored with "return" movements. */
export const cancel = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("دسترسی غیرمجاز.");

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
      throw new Error("سفارش یافت نشد.");
    }
    if (order.status !== "pending") {
      throw new Error("فقط سفارش‌های در انتظار تأیید قابل لغو هستند.");
    }
    if (order.paymentStatus === "refunded") {
      throw new Error("این سفارش قبلاً بازگشت داده شده است.");
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : "failed",
    });

    const items = await ctx.db
      .query("orderItems")
      .withIndex("orderId", (q) => q.eq("orderId", order._id))
      .collect();
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(product._id, { stock: product.stock + item.quantity });
      }
      await ctx.db.insert("inventoryMovements", {
        productId: item.productId,
        type: "return",
        quantity: +item.quantity,
        referenceType: "order_cancel",
        referenceId: order._id,
        notes: `لغو سفارش ${order.orderNumber}`,
        createdBy: userId,
      });
    }
  },
});
