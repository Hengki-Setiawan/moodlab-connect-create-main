import 'dotenv/config';
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq } from 'drizzle-orm';

// Define minimal schema locally to avoid alias issues in script
const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    type: text("type").default("template"),
    category: text("category").default("general"),
    image_url: text("image_url"),
    file_url: text("file_url"),
    stock: integer("stock").default(0),
    benefits: text("benefits"), // Stored as JSON string
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

const reviews = sqliteTable("reviews", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    product_id: integer("product_id").references(() => products.id),
});

const cartItems = sqliteTable("cart_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    product_id: integer("product_id").references(() => products.id),
});

const orderItems = sqliteTable("order_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    product_id: integer("product_id").references(() => products.id),
});

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing credentials");
    process.exit(1);
}

const client = createClient({
    url: url.replace("libsql://", "https://"),
    authToken: authToken,
});

const db = drizzle(client);

const newProducts = [
    {
        name: "Template PPT Company Profile",
        description: `Tingkatkan citra profesional perusahaan Anda dengan Template PPT Company Profile kami. Desain modern, elegan, dan mudah diedit sesuai branding Anda.

Fitur Utama:
- 50+ Slide Unik dengan layout profesional
- Mudah diedit (Drag & Drop)
- Tersedia dalam rasio 16:9 Full HD
- Font gratis dan ikon vektor termasuk`,
        price: 149000,
        type: "template",
        category: "Presentation",
        stock: -1,
        benefits: JSON.stringify([
            "Desain Profesional & Modern",
            "Hemat Waktu Pengerjaan",
            "Mudah Kustomisasi (Warna & Font)",
            "Layout Siap Pakai untuk Berbagai Industri"
        ]),
        image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60"
    },
    {
        name: "E-book Ekonomi, Bisnis, dan Pemasaran",
        description: `Panduan komprehensif untuk menguasai dasar-dasar ekonomi modern, strategi bisnis yang teruji, dan teknik pemasaran digital terkini. Cocok untuk pengusaha pemula, mahasiswa, dan profesional.

Apa yang akan Anda pelajari:
- Analisis pasar dan perilaku konsumen
- Strategi branding dan positioning
- Manajemen keuangan bisnis dasar
- Digital Marketing 101`,
        price: 75000,
        type: "ebook",
        category: "Education",
        stock: -1,
        benefits: JSON.stringify([
            "Bahasa Mudah Dipahami",
            "Studi Kasus Nyata",
            "Akses Seumur Hidup (PDF)",
            "Bonus Checklist Bisnis"
        ]),
        image_url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=60"
    },
    {
        name: "Video Course Premium: Master Digital Marketing",
        description: `Akses ke perpustakaan video course premium kami. Pelajari skill Digital Marketing dari nol hingga mahir. Materi mencakup SEO, FB Ads, Google Ads, dan Social Media Management.

Detail Course:
- 20+ Modul Video HD
- Demo Praktik Langsung
- Sertifikat Penyelesaian
- Grup Support Telegram`,
        price: 299000,
        type: "template", // Using template type for digital access
        category: "Course",
        stock: -1,
        benefits: JSON.stringify([
            "Akses Video Kualitas HD",
            "Materi Terupdate 2024",
            "Diajarkan oleh Praktisi Expert",
            "Akses Fleksibel Kapan Saja"
        ]),
        image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"
    },
    {
        name: "Template Website & Dashboard Admin React",
        description: `Percepat pengembangan proyek web Anda dengan starter kit React + Tailwind CSS ini. Termasuk landing page responsif, dashboard admin lengkap dengan chart, dan autentikasi siap pakai.

Tech Stack: React, Vite, Tailwind CSS, Shadcn UI.`,
        price: 349000,
        type: "template",
        category: "Web Development",
        stock: -1,
        benefits: JSON.stringify([
            "Code Bersih & Terstruktur",
            "Responsive Mobile-First",
            "Dark Mode Support",
            "Komponen UI Lengkap (Shadcn)"
        ]),
        image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60"
    },
    {
        name: "Website ERP To Do List System",
        description: `Sistem ERP mini berbasis web untuk manajemen tugas dan produktivitas tim. Fitur lengkap: Kanban board, time tracking, manajemen proyek, dan laporan kinerja tim.

Sangat cocok untuk tim kecil hingga menengah untuk meningkatkan efisiensi kerja.`,
        price: 1500000,
        type: "template", // Selling code/system
        category: "Software",
        stock: -1,
        benefits: JSON.stringify([
            "Full Source Code",
            "Database Schema Included",
            "Fitur Manajemen User & Role",
            "Laporan Produktivitas Otomatis"
        ]),
        image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
    }
];

async function seed() {
    console.log("Seeding products...");
    try {
        // Clear dependent tables first to avoid FK errors
        console.log("Clearing dependent tables (order_items, cart_items, reviews)...");
        try { await db.delete(orderItems); } catch (e) { console.warn("Failed to delete order_items", e); }
        try { await db.delete(cartItems); } catch (e) { console.warn("Failed to delete cart_items", e); }
        try { await db.delete(reviews); } catch (e) { console.warn("Failed to delete reviews", e); }

        // Clear existing products
        console.log("Deleting existing products...");
        await db.delete(products);

        // Insert new products
        console.log("Inserting new products...");
        await db.insert(products).values(newProducts);

        console.log("Seeding complete! Added 5 new products.");
    } catch (e) {
        console.error("Error during seeding:", e);
    }
}

seed();
