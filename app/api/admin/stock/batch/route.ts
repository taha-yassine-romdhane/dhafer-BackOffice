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
      if (typeof stock.stockId !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: each stock must have stockId (number)' },
          { status: 400 }
        );
      }
      
      // Check that online stock status is provided
      const hasOnlineStatus = 'inStockOnline' in stock;
      
      if (!hasOnlineStatus) {
        return NextResponse.json(
          { success: false, error: 'Invalid input: each stock must have online status' },
          { status: 400 }
        );
      }
      
      // Validate that online status is boolean
      if (typeof stock.inStockOnline !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: online stock status must be boolean' },
          { status: 400 }
        );
      }
    }

    try {
      // Process all updates in a transaction
      const results = await prisma.$transaction(
        stocks.map((stock) => {
          const { stockId, ...updateData } = stock;
          return prisma.stock.update({
            where: { id: stockId },
            data: {
              ...updateData,
              updatedAt: new Date(), // Explicitly update the timestamp
            },
            select: {
              id: true,
              inStockOnline: true,
              size: {
                select: {
                  id: true,
                  value: true,
                }
              },
              colorId: true,
              updatedAt: true,
            },
          });
        })
      );

      console.log('Successfully updated stocks:', results.length);
      
      return NextResponse.json({ 
        success: true, 
        updatedStocks: results
      });
    } catch (dbError) {
      console.error("Database error in batch update:", dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in batch update:", error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update stocks: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
