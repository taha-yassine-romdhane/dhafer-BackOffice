import { NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') as OrderStatus | null;
    
    // Prepare the where clause for filtering by status
    const statusWhere = statusFilter ? { status: statusFilter } : {};
    
    // Get all users with their orders
    const users = await prisma.user.findMany({
      include: {
        orders: {
          where: statusWhere,
          include: {
            items: true,
          },
        },
      },
    });

    // Get all guest orders (where userId is null)
    const guestOrders = await prisma.order.findMany({
      where: {
        userId: null,
        ...statusWhere,
      },
      include: {
        items: true,
      },
    });

    // Group guest orders by phone number
    const guestOrdersByPhone = guestOrders.reduce((acc, order) => {
      if (!acc[order.phoneNumber]) {
        acc[order.phoneNumber] = [];
      }
      acc[order.phoneNumber].push(order);
      return acc;
    }, {} as Record<string, typeof guestOrders>);

    // Calculate metrics for each user
    const registeredClients = users
      .map(user => {
        // Calculate total spent
        const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Get the last order date
        const lastOrderDate = user.orders.length > 0 
          ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
          : null;

        // Group orders by status
        const ordersByStatus = user.orders.reduce((acc, order) => {
          if (!acc[order.status]) acc[order.status] = 0;
          acc[order.status]++;
          return acc;
        }, {} as Record<OrderStatus, number>);

        // Get the most recent orders (up to 5)
        const recentOrders = user.orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(order => ({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt
          }));

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          orderCount: user.orders.length,
          totalSpent,
          fidelityPoints: user.fidelityPoints,
          lastOrderDate,
          isGuest: false,
          ordersByStatus,
          recentOrders
        };
      })
      // Filter to only include clients with at least one order
      .filter(client => client.orderCount > 0);

    // Create virtual guest clients
    const guestClients = Object.entries(guestOrdersByPhone).map(([phoneNumber, orders]) => {
      // Calculate total spent
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Calculate fidelity points: 1 point for each DELIVERED order
      const fidelityPoints = orders.filter(order => order.status === 'DELIVERED').length;
      
      // Get the last order date
      const lastOrderDate = orders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0].createdAt;

      // Group orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        if (!acc[order.status]) acc[order.status] = 0;
        acc[order.status]++;
        return acc;
      }, {} as Record<OrderStatus, number>);

      // Get the most recent orders (up to 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        }));

      return {
        id: `guest-${phoneNumber}`,
        username: orders[0].customerName,
        email: phoneNumber, // Use phone number as email for display purposes
        phoneNumber,
        orderCount: orders.length,
        totalSpent,
        fidelityPoints,
        lastOrderDate,
        isGuest: true,
        ordersByStatus,
        recentOrders
      };
    });

    // Combine registered and guest clients
    const allClients = [...registeredClients, ...guestClients];

    // Sort by order count (descending)
    const sortedClients = allClients.sort((a, b) => b.orderCount - a.orderCount);

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
