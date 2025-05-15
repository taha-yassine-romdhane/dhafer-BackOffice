import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const size = url.searchParams.get('size');
    const color = url.searchParams.get('color');

    // Validate required parameters
    if (!productId || !size || !color) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: productId, size, and color are required' 
        },
        { status: 400 }
      );
    }

    // Convert productId to number
    const productIdNum = parseInt(productId);
    if (isNaN(productIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find the product with its color variants and stocks
    const product = await prisma.product.findUnique({
      where: { id: productIdNum },
      include: {
        colorVariants: {
          where: {
            color: {
              equals: color,
              mode: 'insensitive' // Case-insensitive search
            }
          },
          include: {
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

    if (product.colorVariants.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Color variant "${color}" not found for product ID ${productId}` 
        },
        { status: 404 }
      );
    }

    const colorVariant = product.colorVariants[0];
    
    // Find the stock for the specified size
    const stockItem = colorVariant.stocks.find(stock => 
      stock.size.value.toLowerCase() === size.toLowerCase()
    );

    if (!stockItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Size "${size}" not found for product ID ${productId} and color "${color}"` 
        },
        { status: 404 }
      );
    }

    // Return the stock status
    return NextResponse.json({
      success: true,
      stockStatus: {
        productId: productIdNum,
        productName: product.name,
        color: colorVariant.color,
        size: stockItem.size.value,
        inStockJammel: stockItem.inStockJammel,
        inStockTunis: stockItem.inStockTunis,
        inStockSousse: stockItem.inStockSousse,
        inStockOnline: stockItem.inStockOnline,
        isAvailable: stockItem.inStockOnline === true
      }
    });
  } catch (error) {
    console.error('Error fetching stock status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch stock status' 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
