import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching promotional products...') // Debugging log

    const promoProducts = await prisma.product.findMany({
      where: {
        showInPromo: true, // Only fetch products marked for promotions
      
      },
      orderBy: [
        {
          priority: 'desc', // Order by priority first
        },
        {
          createdAt: 'desc', // Then by creation date
        }
      ],
      include: {
        colorVariants: {
          include: {
            images: true,
          },
        },
      },
    })

    console.log(`Found ${promoProducts.length} promotional products`) // Debugging log
    return NextResponse.json(promoProducts)
  } catch (error) {
    console.error('Error fetching promotional products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotional products' },
      { status: 500 }
    )
  }
}