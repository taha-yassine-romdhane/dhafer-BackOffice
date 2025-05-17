// app/api/admin/stock/[productId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    console.log(`Fetching details for product ID: ${productId}`);
    
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        colorVariants: {
          select: {
            id: true,
            color: true,
            images: {
              select: {
                id: true,
                url: true,
                isMain: true,
              },
            },
            stocks: {
              select: {
                id: true,
                inStockOnline: true,
                size: {
                  select: {
                    id: true,
                    value: true,
                  }
                },
                sizeId: true,
                colorId: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log(`Successfully fetched product ID: ${productId}`);

    return NextResponse.json({ 
      success: true, 
      product: product 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error(`Error fetching product: ${error}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product details',
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
