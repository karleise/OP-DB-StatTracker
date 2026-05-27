/*
  Warnings:

  - You are about to drop the column `colorId` on the `guide` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `guide` DROP FOREIGN KEY `Guide_colorId_fkey`;

-- DropIndex
DROP INDEX `Guide_colorId_idx` ON `guide`;

-- AlterTable
ALTER TABLE `guide` DROP COLUMN `colorId`;

-- CreateTable
CREATE TABLE `GuideColor` (
    `guideId` VARCHAR(191) NOT NULL,
    `colorId` INTEGER NOT NULL,

    INDEX `GuideColor_colorId_idx`(`colorId`),
    PRIMARY KEY (`guideId`, `colorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GuideColor` ADD CONSTRAINT `GuideColor_guideId_fkey` FOREIGN KEY (`guideId`) REFERENCES `Guide`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuideColor` ADD CONSTRAINT `GuideColor_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `Color`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
