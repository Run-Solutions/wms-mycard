-- myorg\apps\backend\prisma\migrations\20250303084240_revert_role_to_string\migration.sql
/*
  Warnings:

  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.


-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `User_roleId_fkey`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `role_id`,
  ADD COLUMN `role` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `roles`;*/
