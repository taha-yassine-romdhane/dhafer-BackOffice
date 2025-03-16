// app/api/admin/stock/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { error } from 'console';

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
                inStock: true,
                size: true,
                colorId: true,
                updatedAt: true,
              },
              orderBy: {
                size: 'asc',
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

    // Transform the data to include location for the UI
    const transformedProducts = products.map(product => ({
      ...product,
      colorVariants: product.colorVariants.map(variant => ({
        ...variant,
        stocks: variant.stocks.map(stock => ({
          ...stock,
          // Add location for UI purposes
          location: 'online' as const,
        })),
      })),
    }));

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
    const { stockId, inStock } = await request.json();
    console.log('Updating stock:', { stockId, inStock });

    if (typeof stockId !== 'number' || typeof inStock !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Update the inStock field directly
    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: { 
        inStock 
      },
      select: {
        id: true,
        inStock: true,
        size: true,
        colorId: true,
        updatedAt: true,
      },
    });

    // Add the location field for the UI
    const transformedStock = {
      ...updatedStock,
      location: 'online' as const,
    };

    return NextResponse.json({ 
      success: true, 
      stock: transformedStock 
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