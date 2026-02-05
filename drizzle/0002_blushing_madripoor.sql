CREATE TABLE `refund_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`user_id` text NOT NULL,
	`item_type` text DEFAULT 'product',
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending',
	`admin_notes` text,
	`refund_amount` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`service_id` text NOT NULL,
	`user_id` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text NOT NULL,
	`briefing` text,
	`service_name` text,
	`service_price` integer,
	`status` text DEFAULT 'pending_contact',
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `cart_items` ADD `service_id` text;--> statement-breakpoint
ALTER TABLE `cart_items` ADD `item_type` text DEFAULT 'product';--> statement-breakpoint
ALTER TABLE `order_items` ADD `service_id` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `item_type` text DEFAULT 'product';