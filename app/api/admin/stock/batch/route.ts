// app/api/admin/stock/batch/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { stocks } = await request.json();
    console.log('Batch updating stocks:', stocks);

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid input: stocks must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each stock update
    for (const stock of stocks) {
      if (typeof stock.stockId !== 'number' || typeof stock.inStock !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: each stock must have stockId (number) and inStock (boolean)' },
          { status: 400 }
        );
      }
    }

    // Process all updates in a transaction
    const results = await prisma.$transaction(
      stocks.map(({ stockId, inStock }) => 
        prisma.stock.update({
          where: { id: stockId },
          data: { inStock },
          select: {
            id: true,
            inStock: true,
            size: true,
            colorId: true,
            updatedAt: true,
          },
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      updatedStocks: results
    });
  } catch (error) {
    console.error("Error in batch update:", error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update stocks',
      },
      { status: 500 }
    );
  }
}
