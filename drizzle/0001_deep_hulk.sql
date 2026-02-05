CREATE TABLE `bundles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`original_price` integer,
	`discount_percent` integer DEFAULT 0,
	`product_ids` text,
	`image_url` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`product_id` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`service_type` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`product_id` integer,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending',
	`total_amount` integer NOT NULL,
	`midtrans_transaction_id` text,
	`payment_type` text,
	`voucher_code` text,
	`discount_amount` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_path_unique` ON `pages` (`path`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`discount_type` text NOT NULL,
	`amount` integer NOT NULL,
	`min_spend` integer DEFAULT 0,
	`max_discount` integer,
	`expiry_date` integer,
	`usage_limit` integer DEFAULT -1,
	`used_count` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vouchers_code_unique` ON `vouchers` (`code`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`type` text DEFAULT 'template',
	`category` text DEFAULT 'general',
	`image_url` text,
	`file_url` text,
	`stock` integer DEFAULT 0,
	`benefits` text,
	`meta_title` text,
	`meta_description` text,
	`keywords` text,
	`preview_images` text,
	`license_type` text DEFAULT 'personal',
	`license_prices` text,
	`mood_category` text DEFAULT 'general',
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "description", "price", "type", "category", "image_url", "file_url", "stock", "benefits", "meta_title", "meta_description", "keywords", "preview_images", "license_type", "license_prices", "mood_category", "created_at") SELECT "id", "name", "description", "price", "type", "category", "image_url", "file_url", "stock", "benefits", "meta_title", "meta_description", "keywords", "preview_images", "license_type", "license_prices", "mood_category", "created_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;