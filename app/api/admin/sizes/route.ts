import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      orderBy: {
        value: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      sizes,
    });
  } catch (error) {
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

    const size = await prisma.size.create({
      data: {
        value,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      size,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create size' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, value, description } = await request.json();

    if (!id || !value) {
      return NextResponse.json(
        { success: false, error: 'Size ID and value are required' },
        { status: 400 }
      );
    }

    const size = await prisma.size.update({
      where: { id },
      data: {
        value,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      size,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update size' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Size ID is required' },
        { status: 400 }
      );
    }

    await prisma.size.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete size' },
      { status: 500 }
    );
  }
}