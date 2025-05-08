import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    console.log('Starting file upload to VPS...');
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    console.log(`Processing ${files.length} files...`);
    const uploadedImages = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = file.type.split('/')[1] || 'png';
      const fileName = `${uniqueSuffix}.${extension}`;
      const filePath = path.join('/var/www/images', fileName);

      // Save file to VPS storage
      await fs.writeFile(filePath, buffer as unknown as string);
      console.log(`File saved: ${filePath}`);

      // Construct URL for image serving
      const imageUrl = `https://images.daralkoftanalassil.com/${fileName}`;

      uploadedImages.push({
        url: imageUrl,
        alt: fileName.split('.')[0],
      });
    }

    console.log('All uploads complete.');
    return NextResponse.json({ success: true, images: uploadedImages });

  } catch (error) {
    console.error('Error in upload process:', error);
    return NextResponse.json({ success: false, error: error as string }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';