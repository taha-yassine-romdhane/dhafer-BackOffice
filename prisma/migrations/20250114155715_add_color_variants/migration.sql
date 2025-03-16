/*
  Warnings:

  - You are about to drop the column `colors` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ProductImage` table. All the data in the column will be lost.
  - Added the required column `colorVariantId` to the `ProductImage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropIndex
DROP INDEX "ProductImage_productId_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "colors";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "productId",
ADD COLUMN     "colorVariantId" INTEGER NOT NULL,
ADD COLUMN     "position" TEXT;

-- CreateTable
CREATE TABLE "ColorVariant" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColorVariant_productId_idx" ON "ColorVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_colorVariantId_idx" ON "ProductImage"("colorVariantId");

-- AddForeignKey
ALTER TABLE "ColorVariant" ADD CONSTRAINT "ColorVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_colorVariantId_fkey" FOREIGN KEY ("colorVariantId") REFERENCES "ColorVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
