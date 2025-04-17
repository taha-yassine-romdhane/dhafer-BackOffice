// app/api/stock/batch/route.ts
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
      if (typeof stock.stockId !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: each stock must have stockId (number)' },
          { status: 400 }
        );
      }
      
      // Check that at least one location stock status is provided
      const hasLocationStatus = 
        'inStockJammel' in stock || 
        'inStockTunis' in stock || 
        'inStockSousse' in stock || 
        'inStockOnline' in stock;
      
      if (!hasLocationStatus) {
        return NextResponse.json(
          { success: false, error: 'Invalid input: each stock must have at least one location status' },
          { status: 400 }
        );
      }
      
      // Validate that all provided location statuses are boolean
      if ('inStockJammel' in stock && typeof stock.inStockJammel !== 'boolean' ||
          'inStockTunis' in stock && typeof stock.inStockTunis !== 'boolean' ||
          'inStockSousse' in stock && typeof stock.inStockSousse !== 'boolean' ||
          'inStockOnline' in stock && typeof stock.inStockOnline !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: all location stock statuses must be boolean' },
          { status: 400 }
        );
      }
    }

    // Process all updates in a transaction
    const results = await prisma.$transaction(
      stocks.map((stock) => {
        const { stockId, ...updateData } = stock;
        return prisma.stock.update({
          where: { id: stockId },
          data: updateData,
          select: {
            id: true,
            inStockJammel: true,
            inStockTunis: true,
            inStockSousse: true,
            inStockOnline: true,
            size: true,
            colorId: true,
            updatedAt: true,
          },
        });
      })
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
