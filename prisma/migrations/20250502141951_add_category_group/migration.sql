-- CreateEnum
CREATE TYPE "CategoryGroup" AS ENUM ('FEMME', 'ENFANT', 'ACCESSOIRE');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "group" "CategoryGroup" NOT NULL DEFAULT 'FEMME';
