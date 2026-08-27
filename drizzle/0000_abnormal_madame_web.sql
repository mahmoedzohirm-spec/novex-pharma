CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"pharmacy_id" integer,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" varchar(30) DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"pharmacy_id" integer NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pharmacies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"password_hash" text DEFAULT '' NOT NULL,
	"encrypted_password" text DEFAULT '',
	"total_debt" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit_limit" numeric(12, 2) DEFAULT '5000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pharmacies_phone_unique" UNIQUE("phone"),
	CONSTRAINT "pharmacies_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"generic_name" text DEFAULT '',
	"category" text DEFAULT 'عام' NOT NULL,
	"description" text DEFAULT '',
	"price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 10 NOT NULL,
	"barcode" text,
	"image_url" text DEFAULT '',
	"manufacturer" text DEFAULT '',
	"expiry_date" text DEFAULT '',
	"bonus_rules" jsonb DEFAULT '[]'::jsonb,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"pharmacy_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"image_url" text DEFAULT '',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text DEFAULT '',
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"pharmacy_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;