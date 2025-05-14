ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4
    ();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now
    ();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now
    ();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profilePicture" varchar(255) DEFAULT NULL;