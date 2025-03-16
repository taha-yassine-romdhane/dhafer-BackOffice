import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalProducts,
      totalOrders,
      totalClients,
      totalRevenue,
      totalStock,
      ordersByStatus,
      topProducts,
      stockByLocation,
      recentOrders,
      monthlyRevenue,
      clientStats
    ] = await Promise.all([
      // Total number of products
      prisma.product.count(),
      
      // Total number of orders
      prisma.order.count(),
      
      // Total number of clients
      prisma.user.count(),
      
      // Total revenue
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          status: {
            not: 'CANCELLED'
          }
        }
      }),

      // Total stock across all locations
      prisma.stock.aggregate({
        _sum: {
          quantity: true
        }
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),

      // Top 5 selling products
      prisma.product.findMany({
        take: 5,
        orderBy: {
          orderCount: 'desc'
        },
        select: {
          id: true,
          name: true,
          orderCount: true,
          price: true
        }
      }),

      // Stock by location
      prisma.stock.groupBy({
        by: ['location'],
        _sum: {
          quantity: true
        }
      }),

      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          items: true,
          user: true
        }
      }),

      // Monthly revenue for the last 6 months
      prisma.order.groupBy({
        by: ['createdAt'],
        _sum: {
          totalAmount: true
        },
        where: {
          status: {
            not: 'CANCELLED'
          },
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      }),

      // Client statistics
      prisma.user.aggregate({
        _avg: {
          fidelityPoints: true
        },
        _count: {
          isSubscribed: true
        }
      })
    ])

    return NextResponse.json({
      overview: {
        totalProducts,
        totalOrders,
        totalClients,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalStock: totalStock._sum.quantity || 0
      },
      ordersByStatus,
      topProducts,
      stockByLocation,
      recentOrders,
      monthlyRevenue,
      clientStats: {
        avgFidelityPoints: Math.round(clientStats._avg.fidelityPoints || 0),
        subscribedCount: clientStats._count.isSubscribed
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
