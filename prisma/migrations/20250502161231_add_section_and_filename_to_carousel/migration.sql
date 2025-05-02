-- AlterTable
ALTER TABLE "CarouselImage" ADD COLUMN     "filename" TEXT,
ADD COLUMN     "section" TEXT NOT NULL DEFAULT 'about';
