import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data:', data);
    if (!data.colorVariants || !Array.isArray(data.colorVariants)) {
      throw new Error('Invalid colorVariants structure');
    }

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

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        category: data.category,
        sizes: data.sizes,
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

    // Create stock entries for each size/color combination
    for (const variant of product.colorVariants) {
      // Prepare stock data for all sizes at once
      const stockData = data.sizes.map((size: string) => {
        // Find if there's a stock configuration for this variant and size in the submitted data
        const stockConfig = data.colorVariants
          .find((cv: { color: string, stocks: any[] }) => cv.color === variant.color)?.stocks
          ?.find((s: { size: string }) => s.size === size);
        
        return {
          inStock: stockConfig?.inStock ?? false, // Use nullish coalescing to default to false
          size: size,
          colorId: variant.id,
          productId: product.id,
        };
      });

      // Create all stocks for this variant in a single database operation
      await prisma.stock.createMany({
        data: stockData,
        skipDuplicates: true, // Skip if a stock with the same unique constraint already exists
      });
    }

    return NextResponse.json({ 
      success: true, 
      product 
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return with success flag and products array
    return NextResponse.json({
      success: true,
      products: products
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