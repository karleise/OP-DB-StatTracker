-- AlterTable
ALTER TABLE `leader` ADD COLUMN `game` ENUM('OP', 'DB') NOT NULL DEFAULT 'OP';

-- CreateIndex
CREATE INDEX `Leader_game_idx` ON `Leader`(`game`);
