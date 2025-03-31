-- CreateTable
CREATE TABLE `work_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ot_number` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `priority` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Abierta',
    `files` JSON NOT NULL,
    `assigned_flow` JSON NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_orders_ot_number_key`(`ot_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_order_id` INTEGER NOT NULL,
    `area_operator_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `issues` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_logs` ADD CONSTRAINT `work_order_logs_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_logs` ADD CONSTRAINT `work_order_logs_area_operator_id_fkey` FOREIGN KEY (`area_operator_id`) REFERENCES `areas_operator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_logs` ADD CONSTRAINT `work_order_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
