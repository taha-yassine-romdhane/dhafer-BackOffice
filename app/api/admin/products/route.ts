import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data:', data);
    if (!data.colorVariants || !Array.isArray(data.colorVariants)) {
      throw new Error('Invalid colorVariants structure');
    }

    // Process color variants
    const colorVariants = data.colorVariants.map((variant: any) => ({
      color: variant.color,
      images: {
        create: Array.isArray(variant.images) ? variant.images.map((image: any, index: number) => ({
          url: image.url,
          isMain: image.isMain || index === 0, // Set the first image as main if not specified
          position: image.position || (index === 0 ? 'front' : index === 1 ? 'back' : 'side'),
        })) : [],
      }
    }));

    // Create the product with basic information
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        collaborateur: data.collaborateur,
        colorVariants: {
          create: colorVariants
        }
      },
      include: {
        colorVariants: {
          include: {
            images: true
          }
        }
      }
    });

    // Connect categories to the product
    if (data.categoryIds && Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
      const categoryConnections = data.categoryIds.map((categoryId: number) => ({
        productId: product.id,
        categoryId: categoryId
      }));

      await prisma.productCategory.createMany({
        data: categoryConnections,
        skipDuplicates: true
      });
    }

    // Connect sizes to the product
    if (data.sizeIds && Array.isArray(data.sizeIds) && data.sizeIds.length > 0) {
      const sizeConnections = data.sizeIds.map((sizeId: number) => ({
        productId: product.id,
        sizeId: sizeId
      }));

      await prisma.productSize.createMany({
        data: sizeConnections,
        skipDuplicates: true
      });
    }

    // Create stock entries for each size/color combination
    for (const variant of product.colorVariants) {
      if (data.sizeIds && Array.isArray(data.sizeIds)) {
        // Prepare stock data for all sizes at once
        const stockData = data.sizeIds.map((sizeId: number) => {
          // Find if there's a stock configuration for this variant and size in the submitted data
          const stockConfig = data.colorVariants
            .find((cv: { color: string, stocks: any[] }) => cv.color === variant.color)?.stocks
            ?.find((s: { sizeId: number }) => s.sizeId === sizeId);
          
          return {
            inStockJammel: stockConfig?.inStockJammel ?? false,
            inStockTunis: stockConfig?.inStockTunis ?? false,
            inStockSousse: stockConfig?.inStockSousse ?? false,
            inStockOnline: stockConfig?.inStockOnline ?? false,
            sizeId: sizeId,
            colorId: variant.id,
            productId: product.id,
          };
        });

        // Create all stocks for this variant in a single database operation
        await prisma.stock.createMany({
          data: stockData,
          skipDuplicates: true
        });
      }
    }

    // Fetch the complete product with all relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        colorVariants: {
          include: {
            images: true
          }
        },
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
        stocks: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      product: completeProduct 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

// GET route remains the same
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        colorVariants: {
          include: {
            images: true
          }
        },
        // Include the categories and sizes relations
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
        stocks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also fetch all available categories and sizes for filtering
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    const sizes = await prisma.size.findMany({
      orderBy: {
        value: 'asc'
      }
    });

    // Return with success flag, products array, and available categories and sizes
    return NextResponse.json({
      success: true,
      products: products,
      categories: categories,
      sizes: sizes
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      },
      { status: 500 }
    );
  }
}