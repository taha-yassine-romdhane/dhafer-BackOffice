import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.fullName || !data.phone || !data.address || !data.productId || !data.colorId || !data.size || !data.quantity || !data.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the product and color variant exist
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        colorVariants: {
          where: { id: data.colorId },
          include: {
            stocks: {
              where: { size: data.size },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.colorVariants.length === 0) {
      return NextResponse.json(
        { error: 'Color variant not found' },
        { status: 404 }
      );
    }

    const stock = product.colorVariants[0].stocks[0];

    if (!stock || stock.quantity < data.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }



    // Create the order
    const order = await prisma.order.create({
      data: {
        customerName: data.fullName,
        phoneNumber: data.phone,
        address: `${data.address}${data.governorate ? `, ${data.governorate}` : ''}`,
        totalAmount: data.price * data.quantity,
        status: 'PENDING',
        items: {
          create: [
            {
              productId: data.productId,
              colorVariantId: data.colorId,
              quantity: data.quantity,
              size: data.size,
              price: data.price,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            colorVariant: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}