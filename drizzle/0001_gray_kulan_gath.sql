CREATE TYPE "public"."package" AS ENUM('basic', 'standard');--> statement-breakpoint
CREATE TABLE "portfolio_comment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"rating" integer,
	"websiteUrl" varchar(255),
	"package" "package",
	"userId" varchar(255) NOT NULL,
	"parentId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "portfolio_post" CASCADE;--> statement-breakpoint
ALTER TABLE "portfolio_comment" ADD CONSTRAINT "portfolio_comment_userId_portfolio_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."portfolio_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_comment" ADD CONSTRAINT "portfolio_comment_parentId_portfolio_comment_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."portfolio_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_user_id_idx" ON "portfolio_comment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "comment_parent_id_idx" ON "portfolio_comment" USING btree ("parentId");