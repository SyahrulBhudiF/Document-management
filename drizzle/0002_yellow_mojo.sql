CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4
      () NOT NULL,
	"name" varchar(255) NOT NULL,
	"mimeType" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"folderId" uuid,
	"ownerId" uuid NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now
      ()
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4
      () NOT NULL,
	"name" varchar(255) NOT NULL,
	"ownerId" uuid NOT NULL,
	"parentId" uuid,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now
      ()
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4
      () NOT NULL,
	"token" varchar(64) NOT NULL,
	"fileId" uuid,
	"folderId" uuid,
	"createdBy" uuid NOT NULL,
	"password" varchar(100),
	"expiresAt" timestamp,
	"downloadCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now
      (),
	CONSTRAINT "shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_folders_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_fileId_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_file_owner" ON "files" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "idx_file_folder" ON "files" USING btree ("folderId");--> statement-breakpoint
CREATE INDEX "idx_folder_owner" ON "folders" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "idx_share_file" ON "shares" USING btree ("fileId");--> statement-breakpoint
CREATE INDEX "idx_share_folder" ON "shares" USING btree ("folderId");--> statement-breakpoint
CREATE INDEX "idx_share_created_by" ON "shares" USING btree ("createdBy");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "deletedAt";