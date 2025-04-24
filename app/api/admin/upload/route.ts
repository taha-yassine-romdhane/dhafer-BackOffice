// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit-config';
// Remove Sharp dependency and use the Python microservice instead


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
      
      // Process image with Python microservice
      let processedImageBuffer;
      try {
        console.log('Sending image to compression microservice...');
        
        // Create form data for the microservice request
        const formData = new FormData();
        formData.append('image', new Blob([buffer], { type: file.type }), file.name);
        formData.append('max_width', '1920');
        formData.append('max_height', '1920');
        formData.append('quality', '85');
        
        // Use the original image format instead of forcing PNG
        // This helps preserve orientation metadata in formats like JPEG
        const format = file.type.includes('png') ? 'PNG' : 
                      file.type.includes('jpeg') || file.type.includes('jpg') ? 'JPEG' : 'PNG';
        formData.append('format', format);
        
        // Send request to the Python microservice
        const response = await fetch('http://localhost:8000/compress', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Microservice error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Compression failed: ${result.error}`);
        }
        
        // Convert base64 back to buffer
        processedImageBuffer = Buffer.from(result.image_base64, 'base64');
        
        console.log(`Original size: ${result.original_size_kb.toFixed(2)} KB`);
        console.log(`Compressed size: ${result.compressed_size_kb.toFixed(2)} KB`);
        console.log(`Compression ratio: ${result.compression_ratio}`);
        console.log(`New dimensions: ${result.width}x${result.height}`);
      } catch (error) {
        console.error('Error processing image with microservice:', error);
        // Fallback to original buffer if microservice processing fails
        processedImageBuffer = buffer;
        console.log('Using original image due to microservice error');
      }
      
      // Create a unique filename - ensure it's properly formatted
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Clean the filename to avoid problematic characters
      let cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
      
      // Preserve the original file extension
      // Extract the original extension
      const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
      // Remove any existing extension
      cleanFileName = cleanFileName.replace(/\.[^/.]+$/, '');
      // Add the original extension back
      cleanFileName = `${cleanFileName}.${originalExtension}`;
      
      const fileName = `${position}-${uniqueSuffix}-${cleanFileName}`;
      
      try {
        // Use the processed image buffer for upload
        // Use the original file type for better preservation of metadata
        const fileType = file.type;
        
        // Upload directly with the processed buffer
        // This is more efficient than base64 encoding for larger files
        
        // Upload to ImageKit with the processed buffer
        // Pass the original file type to ensure proper handling
        const uploadResponse = await imagekit.upload({
          file: processedImageBuffer,
          fileName: fileName,
          folder: '/products',
          tags: [position],
          useUniqueFileName: false,
          // Explicitly set the MIME type to match the original file
          // This helps preserve orientation metadata
          responseFields: ['isPrivateFile', 'tags', 'customCoordinates']
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

export const dynamic = 'force-dynamic'; 