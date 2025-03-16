import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // Make sure to import prisma from your lib

export async function GET() {
  try {
    console.log('Fetching products for home page...') // Debugging log

    const products = await prisma.product.findMany({
      where: {
        showInHome: true, // Only fetch products marked to show in home
      },
      orderBy: [
        {
          priority: 'desc', // First order by priority
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

    console.log('Products fetched:', products) // Debugging log

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error) // Debugging log
    return NextResponse.json(
      { error: 'Failed to fetch products. Please check the server logs.' },
      { status: 500 }
    )
  }
}