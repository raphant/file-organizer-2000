ALTER TABLE "user_usage" ADD COLUMN "minutesUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "meetingMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "maxMeetingMinutes" integer DEFAULT 60 NOT NULL;