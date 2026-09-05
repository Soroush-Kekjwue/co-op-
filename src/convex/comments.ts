import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { ROLES } from "./schema";

/**
 * Product comments: public questions & reviews under each product.
 * New comments go live immediately (isApproved=true); admins can hide them.
 * Hidden comments remain visible to their author and to admins.
 */

async function getViewer(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export const listForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const isStaff =
      !!viewer && viewer.role === ROLES.ADMIN && !viewer.isAnonymous;

    const all = await ctx.db
      .query("comments")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();

    const visible = all.filter(
      (c) => c.isApproved || isStaff || c.userId === viewer?._id,
    );

    const approved = visible.filter((c) => c.isApproved);
    const ratingSum = approved.reduce((sum, c) => sum + (c.rating ?? 0), 0);
    const ratingCount = approved.filter((c) => c.rating).length;

    return {
      comments: visible.map((c) => ({
        _id: c._id,
        body: c.body,
        authorName: c.authorName,
        rating: c.rating,
        isApproved: c.isApproved,
        isMine: viewer?._id === c.userId,
        creationTime: c._creationTime,
      })),
      averageRating: ratingCount > 0 ? ratingSum / ratingCount : null,
      ratingCount,
      totalCount: visible.length,
    };
  },
});

export const add = mutation({
  args: {
    productId: v.id("products"),
    body: v.string(),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("برای ثبت دیدگاه باید وارد حساب خود شوید.");
    }
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("کاربر یافت نشد.");

    const body = args.body.trim();
    if (!body) throw new Error("متن دیدگاه خالی است.");
    if (body.length > 2000) throw new Error("متن دیدگاه بیش از حد طولانی است.");
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("امتیاز باید بین ۱ تا ۵ باشد.");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive) {
      throw new Error("این محصول قابل نظردهی نیست.");
    }

    await ctx.db.insert("comments", {
      productId: args.productId,
      userId,
      authorName: user.name || user.email || "عضو تعاونی",
      body,
      rating: args.rating,
      isApproved: true,
    });
  },
});

export const removeMine = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("دسترسی غیرمجاز.");
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.userId !== userId) {
      throw new Error("دسترسی غیرمجاز.");
    }
    await ctx.db.delete(args.commentId);
  },
});

// --- Admin ---

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    if (!me || me.role !== ROLES.ADMIN || me.isAnonymous) return [];
    const all = await ctx.db.query("comments").order("desc").collect();
    const withProduct = await Promise.all(
      all.map(async (c) => {
        const product = await ctx.db.get(c.productId);
        return {
          ...c,
          productName: product?.name ?? "محصول حذف‌شده",
        };
      }),
    );
    return withProduct;
  },
});

export const setApproved = mutation({
  args: { commentId: v.id("comments"), isApproved: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("دسترسی غیرمجاز.");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== ROLES.ADMIN || me.isAnonymous) {
      throw new Error("دسترسی غیرمجاز.");
    }
    await ctx.db.patch(args.commentId, { isApproved: args.isApproved });
  },
});

export const removeAny = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("دسترسی غیرمجاز.");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== ROLES.ADMIN || me.isAnonymous) {
      throw new Error("دسترسی غیرمجاز.");
    }
    await ctx.db.delete(args.commentId);
  },
});
