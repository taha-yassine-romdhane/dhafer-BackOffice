import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    // Get total products
    const totalProducts = await prisma.product.count();

    // Get orders and calculate revenue - no limit to ensure we get ALL orders
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Total orders fetched: ${orders.length}`);

    const totalOrders = orders.length;
    
    // Store actual order counts by status for reference
    const actualOrderCountsByStatus: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;

    // Get orders by status (actual counts, not duplicated)
    const ordersByStatus = Object.values(OrderStatus).map((status) => {
      const ordersWithStatus = orders.filter((order) => order.status === status);
      const count = ordersWithStatus.length;
      const revenue = ordersWithStatus.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      // Store the actual count for reference
      actualOrderCountsByStatus[status] = count;
      
      return {
        status,
        count,
        revenue,
      };
    });

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map((order) => ({
      id: order.id,
      customerName: order.customerName,
      totalAmount: order.totalAmount || 0,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    // Calculate sales data for the last 7 days
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day to ensure today's orders are included
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    // Create formatted date labels for display
    const dateLabels = last7Days.map((date) => {
      // If it's today, explicitly label it as "Today"
      if (date.toDateString() === new Date().toDateString()) {
        return 'Today';
      }
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const salesData = {
      labels: dateLabels,
      data: last7Days.map((date) => {
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        return dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      }),
    };

    // Get top products by order quantity
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          name: product?.name || 'Unknown Product',
          sales: item._sum.quantity || 0,
        };
      })
    );

    // Calculate status-based sales data for the last 7 days
    const salesByStatus = Object.values(OrderStatus).reduce((acc, status) => {
      acc[status] = last7Days.map((date) => {
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.toDateString() === date.toDateString() &&
            order.status === status
          );
        });
        return dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      });
      return acc;
    }, {} as Record<OrderStatus, number[]>);
    
    // Calculate order counts by status for each day (last 7 days)
    // This is for visualization purposes only and doesn't affect the actual order counts
    const orderCountByStatus = Object.values(OrderStatus).reduce((acc, status) => {
      acc[status] = last7Days.map((date) => {
        return orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.toDateString() === date.toDateString() &&
            order.status === status
          );
        }).length;
      });
      return acc;
    }, {} as Record<OrderStatus, number[]>);
    
    // Calculate monthly data (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();
    
    // Group by week for monthly view
    const groupedMonthlyDates: Date[][] = [];
    let currentWeek: Date[] = [];
    
    last30Days.forEach((date, index) => {
      if (index === 0 || date.getDay() === 0) { // Start new week on Sunday
        if (currentWeek.length > 0) {
          groupedMonthlyDates.push(currentWeek);
        }
        currentWeek = [date];
      } else {
        currentWeek.push(date);
      }
      
      // Push the last week
      if (index === last30Days.length - 1 && currentWeek.length > 0) {
        groupedMonthlyDates.push(currentWeek);
      }
    });
    
    const monthlyLabels = groupedMonthlyDates.map(week => {
      const firstDay = week[0];
      const lastDay = week[week.length - 1];
      return `${firstDay.getDate()}/${firstDay.getMonth() + 1} - ${lastDay.getDate()}/${lastDay.getMonth() + 1}`;
    });
    
    const monthlyOrderCountByStatus = Object.values(OrderStatus).reduce((acc, status) => {
      acc[status] = groupedMonthlyDates.map(week => {
        return orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return week.some(date => 
            orderDate.toDateString() === date.toDateString() &&
            order.status === status
          );
        }).length;
      });
      return acc;
    }, {} as Record<OrderStatus, number[]>);
    
    // Calculate all-time data (grouped by month)
    // Find the earliest order date
    const earliestOrder = orders.length > 0 ? 
      orders.reduce((earliest, order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate < earliest ? orderDate : earliest;
      }, new Date(today)) : 
      new Date(today.getFullYear(), today.getMonth() - 5, 1); // Default to 6 months ago if no orders
    
    // Create array of months from earliest order to now
    const months: Date[] = [];
    const startMonth = new Date(earliestOrder.getFullYear(), earliestOrder.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    for (let month = new Date(startMonth); month <= endMonth; month.setMonth(month.getMonth() + 1)) {
      months.push(new Date(month));
    }
    
    const allTimeLabels = months.map(date => {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    });
    
    const allTimeOrderCountByStatus = Object.values(OrderStatus).reduce((acc, status) => {
      acc[status] = months.map(monthDate => {
        const monthStart = new Date(monthDate);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        return orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate >= monthStart &&
            orderDate <= monthEnd &&
            order.status === status
          );
        }).length;
      });
      return acc;
    }, {} as Record<OrderStatus, number[]>);
    
    // Add last7DaysLabels to the response for reference
    const last7DaysLabels = last7Days.map(date => date.toISOString());

    // Get global stock data
    // Count total stock items
    const totalStockItems = await prisma.stock.count();
    
    // Only count online stock status for the dashboard
    const inStockOnlineItems = await prisma.stock.count({
      where: {
        inStockOnline: true,
      },
    });
    
    const outOfStockOnlineItems = await prisma.stock.count({
      where: {
        inStockOnline: false,
      },
    });
    
    // Get products with stock information for display
    const stockProducts = await prisma.product.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        colorVariants: {
          include: {
            images: true,
            stocks: {
              include: {
                size: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      totalProducts,
      totalOrders,
      recentOrders,
      salesData,
      topProducts: topProductsWithDetails,
      ordersByStatus,
      salesByStatus,
      orderCountByStatus,
      last7DaysLabels,
      monthlyData: {
        labels: monthlyLabels,
        salesByStatus: monthlyOrderCountByStatus
      },
      allTimeData: {
        labels: allTimeLabels,
        salesByStatus: allTimeOrderCountByStatus
      },
      // Include actual order counts by status for accurate display
      actualOrderCountsByStatus,
      globalStock: {
        totalStock: totalStockItems,
        inStockOnline: inStockOnlineItems,
        outOfStockOnline: outOfStockOnlineItems
      },
      stockProducts: stockProducts
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}