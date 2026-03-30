-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'BACKLOG';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "fulfilled" INTEGER NOT NULL DEFAULT 0;
