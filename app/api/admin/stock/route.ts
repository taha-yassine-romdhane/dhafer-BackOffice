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
                quantity: true,
                size: true,
                location: true,
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

    return NextResponse.json({ 
      success: true, 
      products 
    });
  } catch (error) {


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
    const { stockId, quantity } = await request.json();
    console.log('Updating stock:', { stockId, quantity });

    if (typeof stockId !== 'number' || typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      );
    }

    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: { quantity },
      select: {
        id: true,
        quantity: true,
        size: true,
        location: true,
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