import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    type: text("type").$default("template"),
    category: text("category").$default("general"),
    image_url: text("image_url"),
    file_url: text("file_url"),
    stock: integer("stock").default(0),
    benefits: text("benefits"), // Stored as JSON string
    meta_title: text("meta_title"),
    meta_description: text("meta_description"),
    keywords: text("keywords"),
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
    status: text("status").$default("pending"),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").notNull(), // Supabase User ID
    status: text("status").$default("pending"),
    total_amount: integer("total_amount").notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const pages = sqliteTable("pages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
