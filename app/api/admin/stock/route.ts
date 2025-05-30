// app/api/admin/stock/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Starting GET request to /api/admin/stock');
    const products = await prisma.product.findMany({
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
              // No where clause to get any image if available
              orderBy: {
                isMain: 'desc', // Prioritize main images first
              },
              take: 1, // Still only take one image
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
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Successfully fetched ${products.length} products`);

    // Transform the data to match the expected format in the frontend
    const transformedProducts = products.map(product => ({
      ...product,
      colorVariants: product.colorVariants.map(variant => ({
        ...variant,
        stocks: variant.stocks.map(stock => ({
          ...stock,
          // Ensure size is in the correct format
          size: typeof stock.size === 'object' ? stock.size.value : stock.size,
          // Ensure sizeId is included
          sizeId: stock.sizeId,
        })),
      })),
    }));

    return NextResponse.json({ 
      success: true, 
      products: transformedProducts 
    }, {
      headers: {
        // Prevent caching of this response
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stocks',
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

export async function PUT(request: Request) {
  try {
    const { stockId, status } = await request.json();
    console.log('Updating stock:', { stockId, status });

    if (typeof stockId !== 'number' || typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Update online stock status
    const updateData = {
      inStockOnline: status
    };

    // Update the specific location field
    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: updateData,
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
    });

    return NextResponse.json({ 
      success: true, 
      stock: {
        ...updatedStock,
        size: typeof updatedStock.size === 'object' ? updatedStock.size.value : updatedStock.size,
        sizeId: updatedStock.sizeId,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.log("error ", error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update stock',
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