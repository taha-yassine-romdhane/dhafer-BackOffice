import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all stock notifications with optional filters
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isNotified = url.searchParams.get('isNotified');
    const productId = url.searchParams.get('productId');
    
    // Build the query filter
    const filter: any = {};
    
    if (isNotified !== null) {
      filter.isNotified = isNotified === 'true';
    }
    
    if (productId) {
      filter.productId = parseInt(productId);
    }
    
    const notifications = await prisma.stockNotification.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching stock notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock notifications' },
      { status: 500 }
    );
  }
}

// POST new stock notification
export async function POST(request: Request) {
  try {
    const { phoneNumber, productId, productName, size, color } = await request.json();
    
    // Validate required fields
    if (!phoneNumber || !productId || !productName || !size || !color) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Clean phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('216') && formattedPhone.length > 8) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Check if a notification already exists for this product/size/color/phone
    const existingNotification = await prisma.stockNotification.findFirst({
      where: {
        phoneNumber: formattedPhone,
        productId: productId,
        size: size,
        color: color,
        isNotified: false
      }
    });
    
    if (existingNotification) {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to this notification',
        notification: existingNotification
      });
    }
    
    // Create new stock notification
    const notification = await prisma.stockNotification.create({
      data: {
        phoneNumber: formattedPhone,
        productId,
        productName,
        size,
        color,
        isNotified: false
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to stock notification',
      notification
    });
  } catch (error) {
    console.error('Error creating stock notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH to mark notifications as sent
export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notification IDs provided' },
        { status: 400 }
      );
    }
    
    // Update all notifications in the list
    const result = await prisma.stockNotification.updateMany({
      where: {
        id: {
          in: ids.map(id => parseInt(id))
        }
      },
      data: {
        isNotified: true,
        notifiedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as sent`,
      count: result.count
    });
  } catch (error) {
    console.error('Error updating stock notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE a notification
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.stockNotification.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stock notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
