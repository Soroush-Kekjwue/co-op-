import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ROLES } from "./schema";

/**
 * Support messages: a direct thread between a signed-in member and the
 * cooperative. Both customer and admins read/write the same per-user thread.
 */

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export const requireAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const user = await currentUser(ctx);
  if (!user || user.role !== ROLES.ADMIN || user.isAnonymous) {
    throw new Error("دسترسی غیرمجاز.");
  }
  return user;
};

/** Full thread of the signed-in user (customers see their own; admins pass a userId). */
export const listThread = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const me = await currentUser(ctx);
    if (!me) return [];
    const targetId =
      me.role === ROLES.ADMIN && args.userId ? args.userId : me._id;
    return await ctx.db
      .query("messages")
      .withIndex("userId", (q) => q.eq("userId", targetId))
      .order("asc")
      .collect();
  },
});

/** Admin: list of members who have messaged, newest activity first. */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("messages").order("desc").collect();
    const seen = new Map<
      string,
      {
        userId: Id<"users">;
        lastBody: string;
        lastAt: number;
        lastIsAdmin: boolean;
        unreadFromUser: number;
        topic?: string;
      }
    >();
    for (const m of all) {
      const key = m.userId;
      const entry = seen.get(key);
      if (!entry) {
        seen.set(key, {
          userId: m.userId,
          lastBody: m.body,
          lastAt: m._creationTime,
          lastIsAdmin: m.authorIsAdmin,
          unreadFromUser: m.authorIsAdmin ? 0 : m.readByAdmin ? 0 : 1,
          topic: m.topic,
        });
      } else {
        if (!m.authorIsAdmin && !m.readByAdmin) entry.unreadFromUser += 1;
      }
    }
    const threads = [...seen.values()].sort((a, b) => b.lastAt - a.lastAt);
    const withUser = await Promise.all(
      threads.map(async (t) => {
        const user: Doc<"users"> | null = await ctx.db.get(t.userId);
        return {
          ...t,
          userName: user?.name || user?.email || "کاربر",
          userEmail: user?.email ?? "",
        };
      }),
    );
    return withUser;
  },
});

/** Admin: unread message count badge. */
export const unreadCountForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentUser(ctx);
    if (!me || me.role !== ROLES.ADMIN) return 0;
    const all = await ctx.db.query("messages").collect();
    return all.filter((m) => !m.authorIsAdmin && !m.readByAdmin).length;
  },
});

export const send = mutation({
  args: {
    body: v.string(),
    topic: v.optional(v.string()),
    /** Admins only: reply inside a specific member's thread. */
    toUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const me = await currentUser(ctx);
    if (!me) throw new Error("برای ارسال پیام باید وارد حساب شوید.");
    const body = args.body.trim();
    if (!body) throw new Error("متن پیام خالی است.");
    if (body.length > 4000) throw new Error("متن پیام بیش از حد طولانی است.");

    const isAdmin = me.role === ROLES.ADMIN && !me.isAnonymous;
    let threadUserId = me._id;
    if (isAdmin && args.toUserId) {
      threadUserId = args.toUserId;
    }

    await ctx.db.insert("messages", {
      userId: threadUserId,
      authorId: me._id,
      authorIsAdmin: isAdmin,
      body,
      topic: args.topic,
      readByAdmin: isAdmin, // admin's own message needs no read flag
      readByUser: false,
    });
  },
});

/** Mark the whole thread as read for the current viewer. */
export const markThreadRead = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const me = await currentUser(ctx);
    if (!me) return;
    const isAdmin = me.role === ROLES.ADMIN && !me.isAnonymous;
    const targetId =
      isAdmin && args.userId ? args.userId : me._id;
    const messages = await ctx.db
      .query("messages")
      .withIndex("userId", (q) => q.eq("userId", targetId))
      .collect();
    for (const m of messages) {
      if (isAdmin && !m.authorIsAdmin && !m.readByAdmin) {
        await ctx.db.patch(m._id, { readByAdmin: true });
      } else if (!isAdmin && m.authorIsAdmin && !m.readByUser) {
        await ctx.db.patch(m._id, { readByUser: true });
      }
    }
  },
});

/** Customer: count of unread admin replies in my thread. */
export const unreadCountForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return 0;
    const messages = await ctx.db
      .query("messages")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    return messages.filter((m) => m.authorIsAdmin && !m.readByUser).length;
  },
});
