import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    console.log('Fetching orders...');
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                description: true,
                salePrice: true,
                categories: {
                  include: {
                    category: true
                  }
                },
                sizes: {
                  include: {
                    size: true
                  }
                },
              },
            },
            colorVariant: {
              include: {
                images: {
                  where: {
                    isMain: true,
                  },
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    await prisma.$disconnect();

    return NextResponse.json(orders, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Detailed orders fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
export const fetchCache = 'force-no-store';