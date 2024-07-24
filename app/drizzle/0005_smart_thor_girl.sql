ALTER TABLE "user_usage" RENAME COLUMN "meetingMinutes" TO "meetingSeconds";--> statement-breakpoint
ALTER TABLE "user_usage" RENAME COLUMN "maxMeetingMinutes" TO "maxMeetingSeconds";--> statement-breakpoint
ALTER TABLE "user_usage" ALTER COLUMN "maxMeetingSeconds" SET DEFAULT 3600;