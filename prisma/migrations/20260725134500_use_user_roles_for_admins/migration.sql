-- Admin access now uses the existing users.role enum as its single source of truth.
DROP TABLE "platform_admin_accounts";
