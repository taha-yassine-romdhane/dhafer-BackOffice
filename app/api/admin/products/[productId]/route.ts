import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, ColorVariant, ProductImage, Stock } from '@prisma/client';

// Define interfaces for the incoming data
interface UpdateProductImage {
  url: string;
  isMain: boolean;
  position: string;
}

interface UpdateStockData {
  size: string;
  inStockJammel?: boolean;
  inStockTunis?: boolean;
  inStockSousse?: boolean;
  inStockOnline?: boolean;
}

interface UpdateColorVariant {
  color: string;
  images: UpdateProductImage[];
  stocks?: UpdateStockData[];
}

interface UpdateProductData {
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  sizes: string[];
  collaborateur: string | null;
  colorVariants: UpdateColorVariant[];
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const data: UpdateProductData = await request.json();
    console.log('Received update data:', data);

    if (!data.colorVariants || !Array.isArray(data.colorVariants)) {
      throw new Error('Invalid colorVariants structure');
    }

    const updatedProduct = await prisma.$transaction(async (prisma) => {
      // 1. Get existing product with all relations
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          colorVariants: {
            include: {
              images: true,
              stocks: true
            }
          }
        }
      });

      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // 2. Update basic product details
      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice,
          category: data.category,
          sizes: data.sizes,
          collaborateur: data.collaborateur,
        },
      });

      // 3. Handle color variants
      for (const variantData of data.colorVariants) {
        // Find existing color variant
        const existingVariant = existingProduct.colorVariants.find(
          (v: ColorVariant) => v.color === variantData.color
        );

        if (existingVariant) {
          // If variant exists, only update if necessary
          if (existingVariant.color !== variantData.color) {
            await prisma.colorVariant.update({
              where: { id: existingVariant.id },
              data: { color: variantData.color }
            });
          }

          // Handle new images if any
          if (Array.isArray(variantData.images) && variantData.images.length > 0) {
            const newImages = variantData.images.filter((newImg: UpdateProductImage) => 
              !existingVariant.images.some((existingImg: ProductImage) => existingImg.url === newImg.url)
            );

            if (newImages.length > 0) {
              await prisma.productImage.createMany({
                data: newImages.map((image: UpdateProductImage) => ({
                  url: image.url,
                  isMain: image.isMain || false,
                  position: image.position,
                  colorVariantId: existingVariant.id
                }))
              });
            }
          }

          // Update stocks only if sizes have changed
          const sizeChanged = !data.sizes.every((size: string) => 
            existingProduct.sizes.includes(size)
          ) || !existingProduct.sizes.every((size: string) => 
            data.sizes.includes(size)
          );

          if (sizeChanged) {
            // Create new stocks for new sizes
            const newStocksData = data.sizes
              .filter((size: string) => 
                !existingVariant.stocks.some((stock: any) => stock.size === size)
              )
              .map((size: string) => {
                // Find if there's a stock configuration for this variant and size in the submitted data
                const stockConfig = data.colorVariants
                  .find((cv: { color: string, stocks?: any[] }) => cv.color === existingVariant.color)?.stocks
                  ?.find((s: { size: string }) => s.size === size);

                return {
                  inStockJammel: stockConfig?.inStockJammel ?? false, // Use nullish coalescing to default to false
                  inStockTunis: stockConfig?.inStockTunis ?? false,
                  inStockSousse: stockConfig?.inStockSousse ?? false,
                  inStockOnline: stockConfig?.inStockOnline ?? false,
                  size,
                  colorId: existingVariant.id,
                  productId: product.id
                };
              });

            if (newStocksData.length > 0) {
              await prisma.stock.createMany({ 
                data: newStocksData,
                skipDuplicates: true // Skip if a stock with the same unique constraint already exists
              });
            }

            // Remove stocks for removed sizes
            const removedSizes = existingProduct.sizes.filter((size: string) => 
              !data.sizes.includes(size)
            );

            if (removedSizes.length > 0) {
              await prisma.stock.deleteMany({
                where: {
                  AND: [
                    { colorId: existingVariant.id },
                    { size: { in: removedSizes } }
                  ]
                }
              });
            }
          }
        } else {
          // Create new variant with its images and stocks
          const newVariant = await prisma.colorVariant.create({
            data: {
              color: variantData.color,
              productId: product.id,
              images: {
                create: Array.isArray(variantData.images) 
                  ? variantData.images.map((image: UpdateProductImage) => ({
                      url: image.url,
                      isMain: image.isMain || false,
                      position: image.position
                    }))
                  : []
              }
            }
          });

          // Prepare stock data for all sizes
          const stockData = data.sizes.map((size: string) => {
            // Find if there's a stock configuration for this variant and size in the submitted data
            const stockConfig = data.colorVariants
              .find((cv: { color: string, stocks?: any[] }) => cv.color === variantData.color)?.stocks
              ?.find((s: { size: string }) => s.size === size);
            
            return {
              inStockJammel: stockConfig?.inStockJammel ?? false, // Use nullish coalescing to default to false
              inStockTunis: stockConfig?.inStockTunis ?? false,
              inStockSousse: stockConfig?.inStockSousse ?? false,
              inStockOnline: stockConfig?.inStockOnline ?? false,
              size,
              colorId: newVariant.id,
              productId: product.id
            };
          });

          // Create all stocks for this variant in a single database operation
          await prisma.stock.createMany({
            data: stockData,
            skipDuplicates: true // Skip if a stock with the same unique constraint already exists
          });
        }
      }

      // 4. Remove color variants that are no longer needed
      const updatedColorVariantColors = data.colorVariants.map((v: UpdateColorVariant) => v.color);
      const variantsToDelete = existingProduct.colorVariants
        .filter((v: ColorVariant) => !updatedColorVariantColors.includes(v.color));

      if (variantsToDelete.length > 0) {
        await prisma.colorVariant.deleteMany({
          where: {
            id: {
              in: variantsToDelete.map((v: ColorVariant) => v.id)
            }
          }
        });
      }

      // 5. Return updated product with all relations
      return await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          colorVariants: {
            include: {
              images: true,
              stocks: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product'
      },
      { status: 500 }
    );
  }
}


export async function GET(
    request: Request,
    { params }: { params: { productId: string } }
) {
    try {
        const productId = parseInt(params.productId);
        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid product ID' },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                colorVariants: {
                    include: {
                        images: true,
                        stocks: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { productId: string } }
) {
    try {
        const productId = parseInt(params.productId);
        if (isNaN(productId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid product ID' },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id: productId }
        });

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}