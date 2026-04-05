-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('team', 'agency');

-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('none', 'pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('owner', 'manager', 'clipper', 'finance');

-- CreateEnum
CREATE TYPE "OrgMemberStatus" AS ENUM ('active', 'invited', 'removed');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "owner_id" TEXT NOT NULL,
    "bio" TEXT,
    "logo" TEXT,
    "niche_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kyb_status" "KybStatus" NOT NULL DEFAULT 'none',
    "kyb_documents" JSONB,
    "payout_method" TEXT,
    "platform_fee_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL,
    "sub_team" TEXT,
    "commission_rate" DOUBLE PRECISION,
    "status" "OrgMemberStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");

-- CreateIndex
CREATE INDEX "organization_members_org_id_idx" ON "organization_members"("org_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_org_id_user_id_key" ON "organization_members"("org_id", "user_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
