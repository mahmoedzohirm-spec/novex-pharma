// ============================================
// ملف: src/db/schema.ts
// ============================================
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Pharmacies ────────────────────────────────────────────────────────────────
export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull().default(""),
  encryptedPassword: text("encrypted_password").default(""),
  totalDebt: numeric("total_debt", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 })
    .notNull()
    .default("5000"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Admins ─────────────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(), // ✅ تمت الإضافة
});

// ─── Products ───────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name").default(""),
  category: text("category").notNull().default("عام"),
  description: text("description").default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  barcode: text("barcode").unique(),
  imageUrl: text("image_url").default(""),
  manufacturer: text("manufacturer").default(""),
  expiryDate: text("expiry_date").default(""),
  bonusRules: jsonb("bonus_rules").$type<BonusRule[]>().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface BonusRule {
  minQty: number;
  bonusQty: number;
  label: string;
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  bonusQuantity: number;
  price: number;
  total: number;
}

// ─── Receipts ──────────────────────────────────────────────────────────────────
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  imageUrl: text("image_url").default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes").default(""),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  pharmacyId: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  rating: integer("rating").notNull(),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").references(() => pharmacies.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});