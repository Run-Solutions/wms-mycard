/*
  Warnings:

  - A unique constraint covering the columns `[module,role_id]` on the table `module_permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `areas_operator_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `areas_operator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `areas_operator_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `module_permissions_module_role_id_key` ON `module_permissions`(`module`, `role_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_areas_operator_id_fkey` FOREIGN KEY (`areas_operator_id`) REFERENCES `areas_operator`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
