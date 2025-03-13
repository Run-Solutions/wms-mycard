-- DropForeignKey
ALTER TABLE `module_permissions` DROP FOREIGN KEY `module_permissions_user_id_fkey`;

-- DropIndex
DROP INDEX `module_permissions_user_id_fkey` ON `module_permissions`;
