// app/api/admin/orders/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phoneNumber, address, totalAmount, items } = body;

    // Validate required fields
    if (!customerName || !phoneNumber || !address || !totalAmount || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate each item and check stock
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price || !item.size || !item.color) {
        return NextResponse.json(
          { error: 'Invalid item data: missing required fields' },
          { status: 400 }
        );
      }

      // Verify the product exists and get its color variant ID
      const product = await prisma.product.findFirst({
        where: { id: item.productId },
        include: {
          colorVariants: {
            where: {
              color: item.color,
            },
            include: {
              stocks: {
                where: { size: item.size },
              },
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.colorVariants.length === 0) {
        return NextResponse.json(
          { error: `Color variant ${item.color} not found for product ${item.productId}` },
          { status: 404 }
        );
      }

      const stock = product.colorVariants[0].stocks[0];

      if (!stock || stock.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${item.productId} (${item.color}, ${item.size})` },
          { status: 400 }
        );
      }

  

      // Assign the found colorVariantId
      item.colorVariantId = product.colorVariants[0].id;
    }

    // Create the order with validated items
    const order = await prisma.order.create({
      data: {
        customerName,
        phoneNumber,
        address,
        totalAmount,
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price,
            productId: item.productId,
            colorVariantId: item.colorVariantId,
          })),
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

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);

    // Improved error handling
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to create order',
          details: error.message,
          type: error.constructor.name,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order', details: 'Unknown error' },
      { status: 500 }
    );
  }
}