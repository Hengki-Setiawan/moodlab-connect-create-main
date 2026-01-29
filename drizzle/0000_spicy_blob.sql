CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`type` text,
	`category` text,
	`image_url` text,
	`file_url` text,
	`stock` integer DEFAULT 0,
	`benefits` text,
	`meta_title` text,
	`meta_description` text,
	`keywords` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`user_name` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`reply` text,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
