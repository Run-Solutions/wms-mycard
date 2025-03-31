/*
  Warnings:

  - You are about to drop the `work_order_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `work_order_logs` DROP FOREIGN KEY `work_order_logs_area_operator_id_fkey`;

-- DropForeignKey
ALTER TABLE `work_order_logs` DROP FOREIGN KEY `work_order_logs_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `work_order_logs` DROP FOREIGN KEY `work_order_logs_work_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `work_orders` DROP FOREIGN KEY `work_orders_created_by_fkey`;

-- DropTable
DROP TABLE `work_order_logs`;

-- DropTable
DROP TABLE `work_orders`;

-- CreateTable
CREATE TABLE `ordenes_trabajo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_order_number` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `priority` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `files` JSON NOT NULL,
    `assigned_flow` VARCHAR(191) NOT NULL,
    `creator_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordenes_trabajo_work_order_number_key`(`work_order_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_orden_trabajo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_order_id` INTEGER NOT NULL,
    `area_operator_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `observations` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ordenes_trabajo` ADD CONSTRAINT `ordenes_trabajo_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_orden_trabajo` ADD CONSTRAINT `registros_orden_trabajo_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `ordenes_trabajo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_orden_trabajo` ADD CONSTRAINT `registros_orden_trabajo_area_operator_id_fkey` FOREIGN KEY (`area_operator_id`) REFERENCES `areas_operator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_orden_trabajo` ADD CONSTRAINT `registros_orden_trabajo_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
