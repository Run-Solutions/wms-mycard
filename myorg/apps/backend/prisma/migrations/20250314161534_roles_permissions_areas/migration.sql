/*
  Warnings:

  - You are about to drop the column `module` on the `module_permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[module_id,role_id]` on the table `module_permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `module_id` to the `module_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `module_permissions` DROP FOREIGN KEY `module_permissions_role_id_fkey`;

-- DropIndex
DROP INDEX `module_permissions_module_role_id_key` ON `module_permissions`;

-- DropIndex
DROP INDEX `module_permissions_role_id_fkey` ON `module_permissions`;

-- AlterTable
ALTER TABLE `module_permissions` DROP COLUMN `module`,
    ADD COLUMN `module_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `imageName` VARCHAR(191) NOT NULL,
    `logoName` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `module_permissions_module_id_role_id_key` ON `module_permissions`(`module_id`, `role_id`);

-- AddForeignKey
ALTER TABLE `module_permissions` ADD CONSTRAINT `module_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_permissions` ADD CONSTRAINT `module_permissions_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
