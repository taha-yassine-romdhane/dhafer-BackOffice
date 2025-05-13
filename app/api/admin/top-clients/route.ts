import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all users with their orders
    const users = await prisma.user.findMany({
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    // Calculate metrics for each user
    const topClients = users.map(user => {
      // Calculate total spent
      const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Get the last order date
      const lastOrderDate = user.orders.length > 0 
        ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
        : null;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        orderCount: user.orders.length,
        totalSpent,
        fidelityPoints: user.fidelityPoints,
        lastOrderDate: lastOrderDate || new Date(0).toISOString(),
      };
    });

    // Sort by order count (descending)
    const sortedClients = topClients.sort((a, b) => b.orderCount - a.orderCount);

    return NextResponse.json({ clients: sortedClients });
  } catch (error) {
    console.error('Error fetching top clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top clients' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
