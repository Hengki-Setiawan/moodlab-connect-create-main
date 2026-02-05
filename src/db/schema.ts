import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    type: text("type").default("template"), // 'template' | 'ebook' | 'digital' | 'service'
    category: text("category").default("general"),
    image_url: text("image_url"),
    file_url: text("file_url"),
    stock: integer("stock").default(0),
    benefits: text("benefits"), // Stored as JSON string
    meta_title: text("meta_title"),
    meta_description: text("meta_description"),
    keywords: text("keywords"),
    // New e-commerce enhancement columns
    preview_images: text("preview_images"), // JSON array of preview image URLs
    license_type: text("license_type").default("personal"), // 'personal' | 'commercial' | 'extended'
    license_prices: text("license_prices"), // JSON: {"personal": 50000, "commercial": 150000}
    mood_category: text("mood_category").default("general"), // 'professional' | 'hype' | 'minimalist'
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const reviews = sqliteTable("reviews", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    product_id: integer("product_id").references(() => products.id),
    user_name: text("user_name").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    reply: text("reply"),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export const consultations = sqliteTable("consultations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    service_type: text("service_type").notNull(),
    message: text("message").notNull(),
    status: text("status").default("pending"),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});


export const vouchers = sqliteTable("vouchers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    discount_type: text("discount_type").notNull(), // 'percent' or 'fixed'
    amount: integer("amount").notNull(),
    min_spend: integer("min_spend").default(0),
    max_discount: integer("max_discount"), // Max discount amount for percentage vouchers
    expiry_date: integer("expiry_date", { mode: "timestamp" }),
    usage_limit: integer("usage_limit").default(-1), // -1 for unlimited
    used_count: integer("used_count").default(0),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    order_id: integer("order_id").references(() => orders.id),
    product_id: integer("product_id").references(() => products.id),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const pages = sqliteTable("pages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"), // Stores JSON string for flexible content (features, stats, testimonials)
    updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cartItems = sqliteTable("cart_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").notNull(),
    product_id: integer("product_id").references(() => products.id),
    quantity: integer("quantity").notNull().default(1),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").notNull(), // Supabase User ID
    status: text("status").default("pending"),
    total_amount: integer("total_amount").notNull(),
    midtrans_transaction_id: text("midtrans_transaction_id"),
    payment_type: text("payment_type"),
    voucher_code: text("voucher_code"), // Applied voucher
    discount_amount: integer("discount_amount").default(0), // Amount discounted
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

// Product Bundles for E-commerce
export const bundles = sqliteTable("bundles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    original_price: integer("original_price"), // Total price before discount
    discount_percent: integer("discount_percent").default(0),
    product_ids: text("product_ids"), // JSON array of product IDs
    image_url: text("image_url"),
    is_active: integer("is_active").default(1),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Bundle = typeof bundles.$inferSelect;
export type NewBundle = typeof bundles.$inferInsert;
