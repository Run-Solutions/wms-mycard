/*
  Warnings:

  - You are about to drop the `ordenes_trabajo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registros_orden_trabajo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ordenes_trabajo` DROP FOREIGN KEY `ordenes_trabajo_creator_id_fkey`;

-- DropForeignKey
ALTER TABLE `registros_orden_trabajo` DROP FOREIGN KEY `registros_orden_trabajo_area_operator_id_fkey`;

-- DropForeignKey
ALTER TABLE `registros_orden_trabajo` DROP FOREIGN KEY `registros_orden_trabajo_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `registros_orden_trabajo` DROP FOREIGN KEY `registros_orden_trabajo_work_order_id_fkey`;

-- DropTable
DROP TABLE `ordenes_trabajo`;

-- DropTable
DROP TABLE `registros_orden_trabajo`;

-- CreateTable
CREATE TABLE `work_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ot_id` VARCHAR(191) NOT NULL,
    `mycard_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `validated` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_orders_ot_id_key`(`ot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_order_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_flows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_order_id` INTEGER NOT NULL,
    `area_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_files` ADD CONSTRAINT `work_order_files_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_flows` ADD CONSTRAINT `work_order_flows_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_flows` ADD CONSTRAINT `work_order_flows_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas_operator`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
