/*
  Warnings:

  - You are about to drop the column `playStyleId` on the `guide` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `guide` DROP FOREIGN KEY `Guide_playStyleId_fkey`;

-- DropIndex
DROP INDEX `Guide_playStyleId_idx` ON `guide`;

-- AlterTable
ALTER TABLE `guide` DROP COLUMN `playStyleId`;

-- CreateTable
CREATE TABLE `GuidePlayStyle` (
    `guideId` VARCHAR(191) NOT NULL,
    `playStyleId` INTEGER NOT NULL,

    INDEX `GuidePlayStyle_playStyleId_idx`(`playStyleId`),
    PRIMARY KEY (`guideId`, `playStyleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GuidePlayStyle` ADD CONSTRAINT `GuidePlayStyle_guideId_fkey` FOREIGN KEY (`guideId`) REFERENCES `Guide`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuidePlayStyle` ADD CONSTRAINT `GuidePlayStyle_playStyleId_fkey` FOREIGN KEY (`playStyleId`) REFERENCES `PlayStyle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
