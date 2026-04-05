-- CreateEnum
CREATE TYPE "ClipperTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clipper_tier" "ClipperTier" NOT NULL DEFAULT 'bronze';
