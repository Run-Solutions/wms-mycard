/*
  Warnings:

  - Added the required column `user_id` to the `module_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `module_permissions` ADD COLUMN `user_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `module_permissions` ADD CONSTRAINT `module_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
