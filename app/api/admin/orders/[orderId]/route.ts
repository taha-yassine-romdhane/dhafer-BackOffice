import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status } = await request.json();
    const orderId = parseInt(params.orderId);

    if (!status || !orderId || isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid status and order ID are required' },
        { status: 400 }
      );
    }

    // Validate that the status is a valid OrderStatus enum value
    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = parseInt(params.orderId);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order items first to maintain referential integrity
    await prisma.orderItem.deleteMany({
      where: { orderId }
    });

    // Then delete the order itself
    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
