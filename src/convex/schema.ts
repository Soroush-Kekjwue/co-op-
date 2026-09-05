import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// Roles. Kept as an open union so future roles (super_admin, quality_manager,
// supplier_manager, ...) can be added without a migration.
export const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.CUSTOMER),
);
export type Role = Infer<typeof roleValidator>;

// --- Enumerated domain values (no magic strings) ---

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const orderStatusValidator = v.union(
  ...ORDER_STATUSES.map((s) => v.literal(s)),
);
export type OrderStatus = Infer<typeof orderStatusValidator>;

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const paymentStatusValidator = v.union(
  ...PAYMENT_STATUSES.map((s) => v.literal(s)),
);
export type PaymentStatus = Infer<typeof paymentStatusValidator>;

export const QUALITY_STATUSES = ["pending", "passed", "conditional", "failed"] as const;
export const qualityStatusValidator = v.union(
  ...QUALITY_STATUSES.map((s) => v.literal(s)),
);
export type QualityStatus = Infer<typeof qualityStatusValidator>;

export const MOVEMENT_TYPES = ["in", "sale", "adjustment", "return"] as const;
export const movementTypeValidator = v.union(
  ...MOVEMENT_TYPES.map((s) => v.literal(s)),
);
export type MovementType = Infer<typeof movementTypeValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user
    }).index("email", ["email"]), // index for the email. do not remove or modify

    categories: defineTable({
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      sortOrder: v.number(),
    })
      .index("slug", ["slug"])
      .index("sortOrder", ["sortOrder"]),

    products: defineTable({
      categoryId: v.id("categories"),
      name: v.string(),
      slug: v.string(),
      sku: v.string(),
      description: v.optional(v.string()),
      shortDescription: v.optional(v.string()),
      price: v.number(), // Toman
      comparePrice: v.optional(v.number()),
      unit: v.string(), // e.g. کیلوگرم، بسته، شیشه
      weight: v.optional(v.number()), // grams
      stock: v.number(), // denormalized current stock, mirrored by movements
      isActive: v.boolean(),
      isFeatured: v.boolean(),
      isSeasonal: v.boolean(),
      origin: v.string(), // region of origin, e.g. مازندران
      season: v.optional(v.string()),
      storageConditions: v.optional(v.string()),
      producerDescription: v.optional(v.string()),
      supplierId: v.optional(v.id("suppliers")),
    })
      .index("slug", ["slug"])
      .index("sku", ["sku"])
      .index("categoryId", ["categoryId"])
      .index("isActive", ["isActive"])
      .index("supplierId", ["supplierId"]),

    suppliers: defineTable({
      name: v.string(),
      slug: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      region: v.string(),
      description: v.optional(v.string()),
      isActive: v.boolean(),
    }).index("slug", ["slug"]),

    batches: defineTable({
      productId: v.id("products"),
      supplierId: v.optional(v.id("suppliers")),
      batchCode: v.string(), // e.g. ORG-1404-001
      quantity: v.number(),
      productionDate: v.optional(v.string()), // ISO date
      harvestDate: v.optional(v.string()),
      packagingDate: v.optional(v.string()),
      expirationDate: v.optional(v.string()),
      notes: v.optional(v.string()),
      isActive: v.boolean(),
    })
      .index("batchCode", ["batchCode"])
      .index("productId", ["productId"]),

    qualityChecks: defineTable({
      batchId: v.id("batches"),
      status: qualityStatusValidator,
      checkedBy: v.optional(v.string()),
      checkedAt: v.optional(v.number()),
      notes: v.optional(v.string()),
    }).index("batchId", ["batchId"]),

    inventoryMovements: defineTable({
      productId: v.id("products"),
      batchId: v.optional(v.id("batches")),
      type: movementTypeValidator,
      quantity: v.number(), // signed delta: in/return positive, sale/adjustment may be negative
      referenceType: v.optional(v.string()), // e.g. "order", "seed", "admin"
      referenceId: v.optional(v.id("orders")),
      notes: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
    }).index("productId", ["productId"]),

    addresses: defineTable({
      userId: v.id("users"),
      fullName: v.string(),
      phone: v.string(),
      province: v.string(),
      city: v.string(),
      postalCode: v.string(),
      line: v.string(),
      isDefault: v.boolean(),
    }).index("userId", ["userId"]),

    orders: defineTable({
      userId: v.id("users"),
      orderNumber: v.string(),
      status: orderStatusValidator,
      subtotal: v.number(),
      shippingCost: v.number(),
      discount: v.number(),
      total: v.number(),
      paymentStatus: paymentStatusValidator,
      paymentReference: v.optional(v.string()),
      paymentMethod: v.optional(v.string()), // e.g. "on_delivery" | "bank_transfer"
      recipientName: v.string(),
      recipientPhone: v.string(),
      shippingAddress: v.string(), // snapshot string; survives later address edits
      notes: v.optional(v.string()),
    })
      .index("orderNumber", ["orderNumber"])
      .index("userId", ["userId"])
      .index("status", ["status"]),

    orderItems: defineTable({
      orderId: v.id("orders"),
      productId: v.id("products"),
      batchId: v.optional(v.id("batches")),
      productNameSnapshot: v.string(), // snapshot: survives product renames/deletes
      unitPrice: v.number(), // snapshot of price at purchase time
      quantity: v.number(),
      subtotal: v.number(),
    }).index("orderId", ["orderId"]),

    // Direct message thread between a signed-in member and the cooperative.
    // topic is optional so admins can start replies in the same thread.
    messages: defineTable({
      userId: v.id("users"),
      authorId: v.id("users"), // who actually wrote this message
      authorIsAdmin: v.boolean(),
      body: v.string(),
      topic: v.optional(v.string()),
      readByAdmin: v.boolean(),
      readByUser: v.boolean(),
    }).index("userId", ["userId"]), // scan order is (userId, _creationTime)

    // Public questions & reviews under each product. Hidden (unapproved)
    // comments are visible only to their author and to admins.
    comments: defineTable({
      productId: v.id("products"),
      userId: v.id("users"),
      authorName: v.string(), // snapshot at posting time
      body: v.string(),
      rating: v.optional(v.number()), // 1..5
      isApproved: v.boolean(),
    })
      .index("productId", ["productId"])
      .index("userId", ["userId"]),

    // Newsletter / community list. Email verified by double opt-in.
    subscribers: defineTable({
      email: v.string(),
      status: v.union(v.literal("pending"), v.literal("active")),
      subscribedAt: v.number(),
      confirmedAt: v.optional(v.number()),
    }).index("email", ["email"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
