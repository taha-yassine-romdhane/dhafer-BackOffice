import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    // Get SMS subscriber data
    const smsSubscribers = await prisma.sMSSubscriber.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get stock notification data
    const stockNotifications = await prisma.stockNotification.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate subscriber growth over time (monthly)
    const subscriberGrowth = calculateSubscriberGrowth(smsSubscribers);

    // Calculate notification conversion rate
    const notificationConversion = calculateNotificationConversion(stockNotifications);

    // Calculate SMS campaign performance (by source)
    const campaignPerformance = calculateCampaignPerformance(smsSubscribers);

    // Get top ordered products
    const topOrderedProducts = await getTopOrderedProducts();

    return NextResponse.json({
      success: true,
      smsAnalytics: {
        subscriberGrowth,
        notificationConversion,
        campaignPerformance,
        subscriberCount: smsSubscribers.length,
        notificationCount: stockNotifications.length,
        convertedNotificationCount: stockNotifications.filter(n => n.isNotified).length,
      },
      topOrderedProducts,
    });
  } catch (error) {
    console.error('Error fetching data features:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data features' },
      { status: 500 }
    );
  }
}

// Helper function to calculate subscriber growth over time
function calculateSubscriberGrowth(subscribers: any[]) {
  const dailyData: Record<string, number> = {};
  
  subscribers.forEach(subscriber => {
    const date = new Date(subscriber.createdAt);
    // Format as YYYY-MM-DD for daily data
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = 0;
    }
    
    dailyData[dayKey]++;
  });
  
  // Convert to array format for charts
  const labels = Object.keys(dailyData).sort();
  const data = labels.map(day => dailyData[day]);
  
  // Calculate cumulative growth
  const cumulativeData = data.reduce((acc: number[], value, index) => {
    const prevValue = index > 0 ? acc[index - 1] : 0;
    acc.push(prevValue + value);
    return acc;
  }, []);
  
  return {
    labels: labels.map(formatDate),
    newSubscribers: data,
    totalSubscribers: cumulativeData,
  };
}

// Helper function to calculate notification conversion rate
function calculateNotificationConversion(notifications: any[]) {
  const monthlyData: Record<string, { total: number; converted: number }> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { total: 0, converted: 0 };
    }
    
    monthlyData[monthYear].total++;
    
    if (notification.isNotified) {
      monthlyData[monthYear].converted++;
    }
  });
  
  // Convert to array format for charts
  const labels = Object.keys(monthlyData).sort();
  const conversionRates = labels.map(month => {
    const { total, converted } = monthlyData[month];
    return total > 0 ? Math.round((converted / total) * 100) : 0;
  });
  
  return {
    labels: labels.map(formatMonthYear),
    conversionRates,
  };
}

// Helper function to calculate SMS campaign performance by source
function calculateCampaignPerformance(subscribers: any[]) {
  const sourceData: Record<string, number> = {};
  
  subscribers.forEach(subscriber => {
    const source = subscriber.source || 'Unknown';
    
    if (!sourceData[source]) {
      sourceData[source] = 0;
    }
    
    sourceData[source]++;
  });
  
  // Convert to array format for charts
  return Object.entries(sourceData).map(([source, count]) => ({
    source,
    count,
  }));
}

// Helper function to get top ordered products
async function getTopOrderedProducts() {
  // Get all order items with their products
  const orderItems = await prisma.orderItem.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          colorVariants: {
            select: {
              id: true,
              color: true,
              images: {
                select: {
                  id: true,
                  url: true,
                  isMain: true,
                },
              },
            },
          },
        },
      },
      order: {
        select: {
          status: true,
        },
      },
    },
  });

  // Group by product and calculate total quantity and revenue
  const productStats: Record<number, {
    id: number;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    imageUrl?: string;
    color?: string;
    // Update to track all order statuses
    pendingOrders: number;     // PENDING
    confirmedOrders: number;   // CONFIRMED
    shippedOrders: number;     // SHIPPED
    deliveredOrders: number;   // DELIVERED
    cancelledOrders: number;   // CANCELLED
  }> = {};

  orderItems.forEach(item => {
    const productId = item.product.id;
    
    if (!productStats[productId]) {
      // Find the main image or use the first available image
      let imageUrl = undefined;
      let color = undefined;
      
      if (item.product.colorVariants && item.product.colorVariants.length > 0) {
        const variant = item.product.colorVariants[0];
        color = variant.color;
        
        // First try to find the main image
        const mainImage = variant.images.find(img => img.isMain);
        if (mainImage) {
          imageUrl = mainImage.url;
        } else if (variant.images.length > 0) {
          // If no main image, use the first available image
          imageUrl = variant.images[0].url;
        }
      }
      
      productStats[productId] = {
        id: productId,
        name: item.product.name,
        totalQuantity: 0,
        totalRevenue: 0,
        imageUrl,
        color,
        // Initialize all order status counters
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      };
    }
    
    productStats[productId].totalQuantity += item.quantity;
    productStats[productId].totalRevenue += item.price * item.quantity;
    
    // Count by order status - handle all five statuses properly
    switch (item.order.status) {
      case OrderStatus.PENDING:
        productStats[productId].pendingOrders += item.quantity;
        break;
      case OrderStatus.CONFIRMED:
        productStats[productId].confirmedOrders += item.quantity;
        break;
      case OrderStatus.SHIPPED:
        productStats[productId].shippedOrders += item.quantity;
        break;
      case OrderStatus.DELIVERED:
        productStats[productId].deliveredOrders += item.quantity;
        break;
      case OrderStatus.CANCELLED:
        productStats[productId].cancelledOrders += item.quantity;
        break;
      default:
        console.warn(`Unknown order status: ${item.order.status} for product ${productId}`);
    }
  });

  // Convert to array and sort by total quantity
  return Object.values(productStats)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5); // Get top 5
}

// Helper function to format month-year
function formatMonthYear(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Helper function to format date (YYYY-MM-DD) to a more readable format
function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  
  return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
}
