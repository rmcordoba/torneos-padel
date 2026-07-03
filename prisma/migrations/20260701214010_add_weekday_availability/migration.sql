-- CreateEnum
CREATE TYPE "WeekdayTimeBand" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "weekdayAvailability" "WeekdayTimeBand"[] DEFAULT ARRAY[]::"WeekdayTimeBand"[];

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "hasWeekdayPlay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "waitlist_entries" ADD COLUMN     "weekdayAvailability" "WeekdayTimeBand"[] DEFAULT ARRAY[]::"WeekdayTimeBand"[];
