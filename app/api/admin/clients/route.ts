import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch registered clients
    const registeredClients = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isSubscribed: true,
        fidelityPoints: true,
        orders: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch guest orders (where userId is null)
    const guestOrders = await prisma.order.findMany({
      where: {
        userId: null,
      },
      select: {
        id: true,
        customerName: true,
        phoneNumber: true,
        createdAt: true,
        totalAmount: true,
        status: true, // Include order status for fidelity points calculation
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group guest orders by phone number
    const guestOrdersByPhone = guestOrders.reduce((acc, order) => {
      if (!acc[order.phoneNumber]) {
        acc[order.phoneNumber] = [];
      }
      acc[order.phoneNumber].push(order);
      return acc;
    }, {} as Record<string, typeof guestOrders>);

    // Create virtual guest clients
    const guestClients = Object.entries(guestOrdersByPhone).map(([phoneNumber, orders]) => {
      // Calculate fidelity points: 1 point for each DELIVERED order
      const fidelityPoints = orders.filter(order => order.status === 'DELIVERED').length;
      
      return {
        id: `guest-${phoneNumber}`, // Virtual ID with prefix to distinguish from registered users
        username: orders[0].customerName || `Guest`,
        email: phoneNumber, // Use phone number as email for display purposes
        phoneNumber: phoneNumber,
        createdAt: orders[0].createdAt,
        isSubscribed: false,
        fidelityPoints: fidelityPoints,
        isGuest: true, // Flag to identify guest accounts
        orderCount: orders.length,
      };
    });

    // Format registered clients to match guest client structure
    const formattedRegisteredClients = registeredClients.map(client => ({
      ...client,
      isGuest: false,
      orderCount: client.orders.length,
      orders: undefined, // Remove orders array to clean up response
    }));

    // Combine registered and guest clients
    const allClients = [...formattedRegisteredClients, ...guestClients];

    // Sort by creation date (newest first)
    const sortedClients = allClients.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(sortedClients);
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
