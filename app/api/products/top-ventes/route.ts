// app/api/products/top-ventes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching top sales products...'); 

    const products = await prisma.product.findMany({
      where: {
        showInTopSales: true,
      },
      include: {
        colorVariants: {
          include: {
            images: true,
          },
        },
      },
    });

    console.log('Products fetched:', products); 
    console.log('Fetched products:', JSON.stringify(products, null, 2));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error); 
    return NextResponse.json(
      { error: 'Failed to fetch products. Please check the server logs.' },
      { status: 500 }
    );
  }
}