import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all sizes with product count
    const sizes = await prisma.size.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        value: 'asc'
      }
    });

    // Format the response
    const formattedSizes = sizes.map(size => ({
      id: size.id,
      value: size.value,
      description: size.description,
      productCount: size._count.products,
      createdAt: size.createdAt
    }));

    return NextResponse.json({
      success: true,
      sizes: formattedSizes
    });
  } catch (error) {
    console.error('Sizes fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { value, description } = await request.json();

    if (!value) {
      return NextResponse.json(
        { success: false, error: 'Size value is required' },
        { status: 400 }
      );
    }

    // Create a new size in the database
    const size = await prisma.size.create({
      data: {
        value,
        description
      }
    });

    return NextResponse.json({ 
      success: true,
      size
    });
  } catch (error) {
    console.error('Size creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create size' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Size ID is required' },
        { status: 400 }
      );
    }

    // Delete the size (the cascade will handle removing it from products)
    await prisma.size.delete({
      where: {
        id: parseInt(id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Size deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete size' },
      { status: 500 }
    );
  }
}
