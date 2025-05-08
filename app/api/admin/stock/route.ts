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
              where: {
                isMain: true,
              },
              take: 1,
            },
            stocks: {
              select: {
                id: true,
                inStockOnline: true,
                size: true,
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

    // No need for additional transformation with the new schema
    const transformedProducts = products;

    return NextResponse.json({ 
      success: true, 
      products: transformedProducts 
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stocks',
      },
      { status: 500 }
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
        { status: 400 }
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
        size: true,
        colorId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      stock: updatedStock 
    });
  } catch (error) {
    console.log("error ", error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update stock',
      },
      { status: 500 }
    );
  }
}