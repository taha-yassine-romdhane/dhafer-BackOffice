import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProductImage ,ColorVariant, Stock } from '@/lib/types';



export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data:', data);
    if (!data.colorVariants || !Array.isArray(data.colorVariants)) {
      throw new Error('Invalid colorVariants structure');
    }

    const colorVariants = data.colorVariants.map((variant: ColorVariant) => ({
      color: variant.color,
      images: {
        create: Array.isArray(variant.images) ? variant.images.map((image: ProductImage, index: number) => ({
          url: image.url,
          isMain: index === 0, // Set the first image as main
          position: image.position,
          colorVariantId: variant.id
        })) : [],
      },
      stocks: {
        create: variant.stocks.map((stock : Stock) => ({
          quantity: stock.quantity,
          size: stock.size,
          colorId: stock.colorId
        }))
      }
    }));

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        category: data.category,
        sizes: data.sizes,
        collaborateur: data.collaborateur,
        colorVariants: {
          create: colorVariants
        }
      },
      include: {
        colorVariants: {
          include: {
            images: true,
            stocks: true
          }
        }
      }
    });

    const locations = ["jammel", "tunis", "sousse", "online"];
    const initialQuantity = 5;

    for (const variant of product.colorVariants) {
      for (const size of data.sizes) { 
        for (const location of locations) {
          await prisma.stock.create({
            data: {
              quantity: initialQuantity,
              size: size,
              location: location,
              colorId: variant.id, 
              productId: product.id, 
            },
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      product 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

// GET route remains the same
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        colorVariants: {
          include: {
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return with success flag and products array
    return NextResponse.json({
      success: true,
      products: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      },
      { status: 500 }
    );
  }
}