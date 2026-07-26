-- AlterEnum
CREATE TYPE "OrganizationKind" AS ENUM ('personal', 'business');

-- AlterEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- AlterTable profiles
ALTER TABLE "profiles" ADD COLUMN "date_of_birth" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "address_json" JSONB;

-- AlterTable organizations
ALTER TABLE "organizations" ADD COLUMN "kind" "OrganizationKind" NOT NULL DEFAULT 'business';
CREATE INDEX "organizations_kind_idx" ON "organizations"("kind");

-- AlterTable users
ALTER TABLE "users" ADD COLUMN "active_organization_id" TEXT;
CREATE INDEX "users_active_organization_id_idx" ON "users"("active_organization_id");

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "org_role" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invitations_token_hash_key" ON "organization_invitations"("token_hash");
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations"("organization_id");
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");
CREATE INDEX "organization_invitations_status_idx" ON "organization_invitations"("status");

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_active_organization_id_fkey" FOREIGN KEY ("active_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS framework placeholder
ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "organization_invitations" IS 'RLS: inviter/org admins manage; invitee accepts via app';
