import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const size = searchParams.get('size')
    const colorId = searchParams.get('colorId')

    if (!size || !colorId) {
      return NextResponse.json(
        { error: 'Size and colorId are required' },
        { status: 400 }
      )
    }

    const stocks = await prisma.stock.findMany({
      where: {
        productId: parseInt(params.productId),
        size: {
          value: size,
        },
        colorId: parseInt(colorId),
      },
    })

    return NextResponse.json(stocks)
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    )
  }
}
