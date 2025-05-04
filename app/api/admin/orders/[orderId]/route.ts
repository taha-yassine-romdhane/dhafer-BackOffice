import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(
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

    // Fetch order with its items and product details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                colorVariants: {
                  include: {
                    images: true
                  }
                }
              }
            },
            colorVariant: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const orderId = parseInt(params.orderId);

    // Simple status-only update
    if (body.status && Object.keys(body).length === 1) {
      const { status } = body;
      
      if (!orderId || isNaN(orderId)) {
        return NextResponse.json(
          { error: 'Valid order ID is required' },
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

      // Check if order exists and include userId
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          userId: true
        }
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Check if status is being changed to SHIPPED and if the order is associated with a user
      if (status === 'DELIVERED' && existingOrder.status !== 'DELIVERED' && existingOrder.userId) {
        console.log(`Order ${orderId} status changed to DELIVERED. Awarding fidelity point to user ${existingOrder.userId}`);
        
        // Update the order status and award fidelity point in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Update order status
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: status as OrderStatus },
            include: {
              items: {
                include: {
                  product: true,
                  colorVariant: true
                }
              }
            }
          });
          
          // Award fidelity point to the user
          if (existingOrder.userId) {
            await tx.user.update({
              where: { id: existingOrder.userId },
              data: { fidelityPoints: { increment: 1 } }
            });
          }
          
          return updatedOrder;
        });
        
        return NextResponse.json(result);
      } else {
        // Regular status update without fidelity point
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: status as OrderStatus },
          include: {
            items: {
              include: {
                product: true,
                colorVariant: true
              }
            }
          }
        });
        
        return NextResponse.json(updatedOrder);
      }
    } 
    // Full order update with customer information and potentially items
    else {
      const { customerName, phoneNumber, address, status, items } = body;
      
      if (!orderId || isNaN(orderId)) {
        return NextResponse.json(
          { error: 'Valid order ID is required' },
          { status: 400 }
        );
      }

      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true
        }
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Create a transaction to handle multiple database operations
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update the order's customer information and status
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            customerName,
            phoneNumber,
            address,
            status: status as OrderStatus,
          }
        });

        // 2. Handle item changes if items array provided
        if (items && Array.isArray(items)) {
          // Get existing item IDs
          const existingItemIds = existingOrder.items.map(item => item.id);
          // Get new item IDs
          const updatedItemIds = items.map(item => item.id);

          // Find items to delete (in existing but not in updated)
          const itemIdsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));

          // Delete removed items
          if (itemIdsToDelete.length > 0) {
            await tx.orderItem.deleteMany({
              where: {
                id: {
                  in: itemIdsToDelete
                }
              }
            });
          }

          // Update existing items
          for (const item of items) {
            if (existingItemIds.includes(item.id)) {
              await tx.orderItem.update({
                where: { id: item.id },
                data: {
                  quantity: item.quantity,
                  sizeId: item.sizeId,
                  color: item.color,
                  price: item.price,
                  productId: item.productId,
                  colorVariantId: item.colorVariantId,
                }
              });
            }
          }

          // Recalculate total amount
          const updatedItems = await tx.orderItem.findMany({
            where: { orderId },
            include: {
              product: true
            }
          });

          const totalAmount = updatedItems.reduce(
            (sum, item) => sum + (item.quantity * item.price), 
            0
          );

          // Update the order with new total
          await tx.order.update({
            where: { id: orderId },
            data: { totalAmount }
          });
        }

        // Return the fully updated order with all relations
        return tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: true,
                colorVariant: {
                  include: {
                    images: true
                  }
                }
              }
            }
          }
        });
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const orderId = parseInt(params.orderId);
    const { address, status, items } = body;
    
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create a transaction to handle multiple database operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update only the address and status, not customer name or phone
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          // Customer name and phone are intentionally excluded to prevent changes
          address,
          status: status as OrderStatus,
        }
      });

      // 2. Handle item changes if items array provided
      if (items && Array.isArray(items)) {
        // Get existing item IDs
        const existingItemIds = existingOrder.items.map(item => item.id);
        // Get new item IDs
        const updatedItemIds = items.map(item => item.id);

        // Find items to delete (in existing but not in updated)
        const itemIdsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));

        // Delete removed items
        if (itemIdsToDelete.length > 0) {
          await tx.orderItem.deleteMany({
            where: {
              id: {
                in: itemIdsToDelete
              }
            }
          });
        }

        // Update existing items
        for (const item of items) {
          if (existingItemIds.includes(item.id)) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                size: item.size,
                color: item.color
              }
            });
          }
        }

        // Recalculate total amount
        const updatedItems = await tx.orderItem.findMany({
          where: { orderId },
          include: {
            product: true
          }
        });

        const totalAmount = updatedItems.reduce(
          (sum, item) => sum + (item.quantity * item.product.price), 
          0
        );

        // Update the order with new total
        await tx.order.update({
          where: { id: orderId },
          data: { totalAmount }
        });
      }

      // Return the fully updated order with all relations
      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
              colorVariant: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : 'Unknown error' },
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
