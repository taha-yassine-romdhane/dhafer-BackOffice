// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit-config';

export async function POST(request: Request) {
  try {
    console.log('Starting file upload to ImageKit...');
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const positions = formData.getAll('positions') as string[];
    
    console.log(`Processing ${files.length} files...`);
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const position = positions[i] || 'side'; // default to 'side' if position not specified
      
      console.log(`Processing file: ${file.name}, position: ${position}, type: ${file.type}`);
      
      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create a unique filename - ensure it's properly formatted
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Clean the filename to avoid problematic characters
      const cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${position}-${uniqueSuffix}-${cleanFileName}`;
      
      try {
        // Upload to ImageKit directly with the buffer
        // ImageKit SDK expects a buffer or a readable stream for the file parameter
        const uploadResponse = await imagekit.upload({
          file: buffer,
          fileName: fileName,
          folder: '/products',
          tags: [position],
          useUniqueFileName: false
        });

        console.log(`File uploaded successfully to ImageKit. URL: ${uploadResponse.url}`);
        
        // Determine if this is the main image based on position
        const isMain = position === 'main' || (i === 0 && files.length === 1);
        
        uploadedImages.push({
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
          position: position,
          thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
          isMain: isMain,
          alt: cleanFileName.split('.')[0]
        });
      } catch (uploadError) {
        console.error(`Error uploading file ${fileName} to ImageKit:`, uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        throw new Error(`Failed to upload ${fileName} to ImageKit`);
      }
    }

    console.log('All uploads complete. Uploaded images:', uploadedImages);
    return NextResponse.json({ 
      success: true, 
      images: uploadedImages 
    });
  } catch (error) {
    console.error('Error in upload process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload images' 
      },
      { status: 500 }
    );
  }
}

// New route segment configuration
export const dynamic = 'force-dynamic'; // Ensure the route is dynamic