import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Fetch the product with all its related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        stocks: {
          include: {
            size: true
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

    console.log(`Fetched product ${productId} with sizes:`, 
      product.sizes.map(s => ({ sizeId: s.sizeId, value: s.size.value }))
    );

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(`Error fetching product ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product' 
      },
      { status: 500 }
    );
  }
}
