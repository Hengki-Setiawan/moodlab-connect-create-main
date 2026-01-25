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
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
