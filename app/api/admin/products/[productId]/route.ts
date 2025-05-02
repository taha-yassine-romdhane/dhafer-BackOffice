import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, ColorVariant, ProductImage, Stock, Category, Size } from '@prisma/client';

// Define interfaces for the incoming data
interface UpdateProductImage {
  url: string;
  isMain: boolean;
  position: string;
}

interface UpdateStockData {
  size: string;
  sizeId?: number; // Added for new structure
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
  categoryIds: number[];
  sizeIds: number[];
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

    // 1. Get existing product with all relations
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: true,
        sizes: true,
        colorVariants: {
          include: {
            images: true,
            stocks: true
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 2. Update basic product details
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        collaborateur: data.collaborateur,
      },
    });
    
    // 3. Update product categories
    // First, delete all existing product-category relationships
    await prisma.productCategory.deleteMany({
      where: { productId }
    });
    
    // Then create new relationships
    if (data.categoryIds && data.categoryIds.length > 0) {
      for (const categoryId of data.categoryIds) {
        await prisma.productCategory.create({
          data: {
            productId,
            categoryId
          }
        });
      }
    }
    
    // 4. Update product sizes
    // First, delete all existing product-size relationships
    await prisma.productSize.deleteMany({
      where: { productId }
    });
    
    // Then create new relationships
    if (data.sizeIds && data.sizeIds.length > 0) {
      for (const sizeId of data.sizeIds) {
        await prisma.productSize.create({
          data: {
            productId,
            sizeId
          }
        });
      }
    }

      // 5. Handle color variants
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

          // Get the sizes for the selected size IDs
          const sizes = await prisma.size.findMany({
            where: {
              id: {
                in: data.sizeIds
              }
            }
          });
          
          // Update stocks only if sizes have changed
          const sizeChanged = true; // Always update stocks with the new size structure

          if (sizeChanged) {
            // Get the sizes for the selected size IDs if not already fetched
            const sizesForStocks = sizes.length > 0 ? sizes : await prisma.size.findMany({
              where: {
                id: {
                  in: data.sizeIds
                }
              }
            });
            
            // Create new stocks for new sizes
            const newStocksData = sizesForStocks
              .filter((size) => 
                !existingVariant.stocks.some((stock: any) => stock.sizeId === size.id)
              )
              .map((size) => ({
                sizeId: size.id,
                colorId: existingVariant.id,
                productId,
                inStockJammel: false,
                inStockTunis: false,
                inStockSousse: false,
                inStockOnline: false
              }));

            if (newStocksData.length > 0) {
              for (const stockData of newStocksData) {
                await prisma.stock.create({
                  data: stockData
                });
              }
            }

            // First get the existing product sizes
            const productSizes = await prisma.productSize.findMany({
              where: { productId },
              include: { size: true }
            });
            
            // Get size IDs that are no longer selected
            const existingSizeIds = productSizes.map(ps => ps.sizeId);
            const removedSizeIds = existingSizeIds.filter(sizeId => 
              !data.sizeIds.includes(sizeId)
            );

            if (removedSizeIds.length > 0) {
              await prisma.stock.deleteMany({
                where: {
                  AND: [
                    { colorId: existingVariant.id },
                    { sizeId: { in: removedSizeIds } }
                  ]
                }
              });
            }
          }
        } else {
          // Create a new color variant
          const newVariant = await prisma.colorVariant.create({
            data: {
              color: variantData.color,
              productId: product.id
            }
          });

          // Create images for the new variant
          if (Array.isArray(variantData.images) && variantData.images.length > 0) {
            await prisma.productImage.createMany({
              data: variantData.images.map((image: UpdateProductImage) => ({
                url: image.url,
                isMain: image.isMain || false,
                position: image.position,
                colorVariantId: newVariant.id
              }))
            });
          }

          // Get the sizes for the selected size IDs
          const sizesForVariant = await prisma.size.findMany({
            where: {
              id: {
                in: data.sizeIds
              }
            }
          });

          // Prepare stock data for all sizes
          const stockData = sizesForVariant.map((size: { id: number, value: string }) => {
            // Find stock config by matching size value (for backward compatibility)
            const stockConfig = variantData.stocks
              ?.find((s: { size: string }) => s.size === size.value);
            
            return {
              inStockJammel: stockConfig?.inStockJammel ?? false,
              inStockTunis: stockConfig?.inStockTunis ?? false,
              inStockSousse: stockConfig?.inStockSousse ?? false,
              inStockOnline: stockConfig?.inStockOnline ?? false,
              sizeId: size.id,
              colorId: newVariant.id,
              productId: product.id
            };
          });

          // Create stocks for this variant one by one
          for (const stock of stockData) {
            await prisma.stock.create({
              data: stock
            });
          }
        }
      }

      // 6. Remove color variants that are no longer needed
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

      // 7. Return updated product with all relations
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          sizes: {
            include: {
              size: true
            }
          },
          colorVariants: {
            include: {
              images: true,
              stocks: {
                include: {
                  size: true
                }
              }
            }
          }
        }
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
                categories: {
                    include: {
                        category: true
                    }
                },
                sizes: {
                    include: {
                        size: true
                    }
                },
                colorVariants: {
                    include: {
                        images: true,
                        stocks: {
                            include: {
                                size: true
                            }
                        }
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