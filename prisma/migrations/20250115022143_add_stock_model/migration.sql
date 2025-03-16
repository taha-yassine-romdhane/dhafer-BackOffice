/*
  Warnings:

  - Added the required column `colorVariantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "colorVariantId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "productId" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "colorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_productId_location_size_colorId_key" ON "Stock"("productId", "location", "size", "colorId");

-- CreateIndex
CREATE INDEX "OrderItem_colorVariantId_idx" ON "OrderItem"("colorVariantId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorVariantId_fkey" FOREIGN KEY ("colorVariantId") REFERENCES "ColorVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ColorVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
