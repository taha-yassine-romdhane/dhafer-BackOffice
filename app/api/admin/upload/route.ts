// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit-config';
import sharp from 'sharp';



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
      
      console.log(`Original file size: ${buffer.length / 1024 / 1024} MB`);
      console.log(`File type: ${file.type}`);
      
      // Process image with Sharp
      let processedImageBuffer;
      try {
        // Get image metadata to preserve orientation
        const metadata = await sharp(buffer).metadata();
        
        // Use Sharp to process the image while maintaining original orientation
        let sharpInstance = sharp(buffer)
          .resize(1920, 1920, { 
            fit: 'inside', 
            withoutEnlargement: true,
            position: 'centre' // Center the image if it needs cropping
          })
          .toFormat('png') // Convert to PNG for better quality
          .png({ quality: 85 }); // Set PNG quality
        
        // Preserve original orientation/rotation if available
        if (metadata.orientation) {
          sharpInstance = sharpInstance.rotate(); // Auto-rotate based on orientation metadata
        }
        
        // Generate the final buffer
        processedImageBuffer = await sharpInstance.toBuffer();
          
        console.log(`Processed file size: ${processedImageBuffer.length / 1024 / 1024} MB`);
      } catch (sharpError) {
        console.error('Error processing image with Sharp:', sharpError);
        // Fallback to original buffer if Sharp processing fails
        processedImageBuffer = buffer;
      }
      
      // Create a unique filename - ensure it's properly formatted
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Clean the filename to avoid problematic characters
      let cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
      
      // Always use .png extension regardless of original file type
      if (!cleanFileName.endsWith('.png')) {
        // Remove any existing extension
        cleanFileName = cleanFileName.replace(/\.[^/.]+$/, '');
        // Add .png extension
        cleanFileName = `${cleanFileName}.png`;
      }
      
      const fileName = `${position}-${uniqueSuffix}-${cleanFileName}`;
      
      try {
        // Use the processed image buffer for upload
        // Always use PNG format for better compatibility
        const fileType = 'image/png';
        
        // Upload directly with the processed buffer
        // This is more efficient than base64 encoding for larger files
        
        // Upload to ImageKit with the processed buffer
        const uploadResponse = await imagekit.upload({
          file: processedImageBuffer,
          fileName: fileName,
          folder: '/products',
          tags: [position],
          useUniqueFileName: false
        });

        // Ensure we have a valid response
        if (!uploadResponse || typeof uploadResponse !== 'object') {
          throw new Error('Invalid response from ImageKit');
        }

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