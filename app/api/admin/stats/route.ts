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
      inStockCount,
      outOfStockCount,
      ordersByStatus,
      topProducts,
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
      prisma.stock.count(),

      // Count items that are in stock
      prisma.stock.count({
        where: {
          inStock: true
        }
      }),

      // Count items that are out of stock
      prisma.stock.count({
        where: {
          inStock: false
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
        totalStock,
        inStockCount,
        outOfStockCount
      },
      ordersByStatus,
      topProducts,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customerName: order.customerName || 'Guest',
        totalAmount: order.totalAmount || 0,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      })),
      monthlyRevenue,
      clientStats: {
        avgFidelityPoints: clientStats?._avg?.fidelityPoints || 0,
        subscribedCount: clientStats?._count?.isSubscribed || 0
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
