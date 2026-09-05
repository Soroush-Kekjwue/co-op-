import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Newsletter / community subscriptions.
 * MVP flow: an address may subscribe once; re-subscribing an existing
 * address is idempotent (no duplicate rows, no error surfaced to the user).
 * Double opt-in confirmation is a future step alongside transactional email.
 */
export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("نشانی ایمیل معتبر نیست.");
    }

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      // Idempotent: already on the list.
      return { ok: true, alreadySubscribed: true };
    }

    await ctx.db.insert("subscribers", {
      email,
      status: "pending",
      subscribedAt: Date.now(),
    });
    return { ok: true, alreadySubscribed: false };
  },
});
