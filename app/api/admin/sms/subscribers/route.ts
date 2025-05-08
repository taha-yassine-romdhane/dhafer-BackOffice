import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all subscribers
export async function GET(request: Request) {
  try {
    const subscribers = await prisma.sMSSubscriber.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ success: true, subscribers });
  } catch (error) {
    console.error('Error fetching SMS subscribers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

// POST new subscriber
export async function POST(request: Request) {
  try {
    const { phoneNumber, name, source } = await request.json();
    
    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Clean the phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('216') && formattedPhone.length > 8) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Make sure it's a valid Tunisian phone number
    if (!/^\d{8}$/.test(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Check if this number already exists
    const existingSubscriber = await prisma.sMSSubscriber.findFirst({
      where: {
        phoneNumber: formattedPhone
      }
    });
    
    if (existingSubscriber) {
      // Update existing subscriber to be active if it was inactive
      if (!existingSubscriber.isActive) {
        await prisma.sMSSubscriber.update({
          where: { id: existingSubscriber.id },
          data: { isActive: true }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed',
        subscriber: existingSubscriber
      });
    }
    
    // Create new subscriber
    const subscriber = await prisma.sMSSubscriber.create({
      data: {
        phoneNumber: formattedPhone,
        name: name || null,
        source: source || 'website',
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true, 
      message: 'Successfully subscribed',
      subscriber
    });
  } catch (error) {
    console.error('Error creating SMS subscriber:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscriber' },
      { status: 500 }
    );
  }
}

// DELETE a subscriber
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscriber ID is required' },
        { status: 400 }
      );
    }
    
    // We'll just mark as inactive rather than delete
    await prisma.sMSSubscriber.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Subscriber unsubscribed successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing SMS subscriber:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
