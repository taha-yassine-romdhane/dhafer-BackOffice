// app/api/admin/products/[productId]/display/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, ProductDisplayUpdate } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const updates: ProductDisplayUpdate = await request.json();

    // Validate and clean the updates
    const validUpdates = {
      ...(typeof updates.showInHome === 'boolean' && { showInHome: updates.showInHome }),
      ...(typeof updates.showInPromo === 'boolean' && { showInPromo: updates.showInPromo }),
      ...(typeof updates.showInTopSales === 'boolean' && { showInTopSales: updates.showInTopSales }),
      ...(typeof updates.priority === 'number' && { priority: updates.priority }),
    };

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: validUpdates,
      include: {
        colorVariants: {
          include: {
            images: true,
            stocks: true,
          },
        },
        stocks: true,
      },
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product display settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product display settings'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      include: {
        colorVariants: {
          include: {
            images: true,
            stocks: true,
          },
        },
        stocks: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product'
      },
      { status: 500 }
    );
  }
}