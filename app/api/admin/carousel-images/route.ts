import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Use raw SQL query since the Prisma client hasn't been updated yet
    const carouselImages = await prisma.$queryRaw`
      SELECT * FROM "CarouselImage" ORDER BY section ASC, position ASC
    `;

    return NextResponse.json({
      success: true,
      carouselImages,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch carousel images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, title, description, buttonText, buttonLink, position, isActive, section, filename } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Use raw SQL query since the Prisma client hasn't been updated yet
    const result = await prisma.$executeRaw`
      INSERT INTO "CarouselImage" (url, title, description, "buttonText", "buttonLink", section, filename, position, "isActive", "createdAt", "updatedAt")
      VALUES (${url}, ${title || null}, ${description || null}, ${buttonText || null}, ${buttonLink || null}, ${section || 'about'}, ${filename || null}, ${position || 0}, ${isActive !== undefined ? isActive : true}, NOW(), NOW())
      RETURNING *
    `;
    
    // Fetch the created image
    const carouselImages = await prisma.$queryRaw`
      SELECT * FROM "CarouselImage" ORDER BY "createdAt" DESC LIMIT 1
    `;
    const carouselImage = Array.isArray(carouselImages) && carouselImages.length > 0 ? carouselImages[0] : null;

    return NextResponse.json({
      success: true,
      carouselImage,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create carousel image' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, url, title, description, buttonText, buttonLink, position, isActive } = await request.json();

    if (!id || !url) {
      return NextResponse.json(
        { success: false, error: 'Image ID and URL are required' },
        { status: 400 }
      );
    }

    // Use raw SQL query since the Prisma client hasn't been updated yet
    await prisma.$executeRaw`
      UPDATE "CarouselImage"
      SET url = ${url},
          title = ${title || null},
          description = ${description || null},
          "buttonText" = ${buttonText || null},
          "buttonLink" = ${buttonLink || null},
          position = ${position},
          "isActive" = ${isActive},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    
    // Fetch the updated image
    const carouselImages = await prisma.$queryRaw`
      SELECT * FROM "CarouselImage" WHERE id = ${id}
    `;
    const carouselImage = Array.isArray(carouselImages) && carouselImages.length > 0 ? carouselImages[0] : null;

    return NextResponse.json({
      success: true,
      carouselImage,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update carousel image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for query parameters first
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    // If no query parameter, try to get from body
    let idFromBody;
    if (!idParam) {
      try {
        const body = await request.json();
        idFromBody = body.id;
      } catch (e) {
        // No body or invalid JSON
      }
    }
    
    const idString = idParam || idFromBody;
    
    if (!idString) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Convert to number for the database
    const imageId = parseInt(idString, 10);
    
    if (isNaN(imageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Use raw SQL query since the Prisma client hasn't been updated yet
    await prisma.$executeRaw`
      DELETE FROM "CarouselImage" WHERE id = ${imageId}
    `;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete carousel image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
