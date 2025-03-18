/*
  Warnings:

  - You are about to drop the column `role_id` on the `modules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `modules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `modules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `modules` DROP COLUMN `role_id`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `modules_name_key` ON `modules`(`name`);
