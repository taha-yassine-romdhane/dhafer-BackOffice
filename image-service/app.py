from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, ExifTags
import io
import uvicorn
import os
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="Image Compression Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Image Compression Service is running"}

@app.post("/compress")
async def compress_image(
    image: UploadFile = File(...),
    quality: Optional[int] = Form(85),
    format: Optional[str] = Form("JPEG"),  # JPEG for better compression
    preserve_resolution: Optional[bool] = Form(True)  # Always preserve original resolution
):
    try:
        logging.info(f"Processing image: {image.filename}, format: {format}, quality: {quality}")
        
        # Read the uploaded image
        contents = await image.read()
        input_image = Image.open(io.BytesIO(contents))
        
        # Get original size and format
        original_width, original_height = input_image.size
        original_size = len(contents)
        original_format = input_image.format
        original_mode = input_image.mode
        
        logging.info(f"Original image: {original_width}x{original_height}, {original_size/1024:.2f}KB, format: {original_format}, mode: {original_mode}")
        
        # Preserve the original image mode if possible
        # This helps maintain color profiles and transparency
        target_mode = original_mode
        
        # Fix orientation based on EXIF data using ImageOps for better handling
        try:
            if hasattr(input_image, '_getexif') and input_image._getexif() is not None:
                input_image = ImageOps.exif_transpose(input_image)
                logging.info("Applied EXIF orientation correction")
        except Exception as e:
            logging.warning(f"Could not process EXIF data: {str(e)}")
        
        # Keep the original resolution - no resizing
        logging.info(f"Preserving original resolution: {original_width}x{original_height}")
        
        # Determine the best output format
        output_format = format.upper()
        
        # If original is PNG with transparency and output is JPEG, we need to handle transparency
        if 'A' in input_image.mode and output_format == 'JPEG':
            # Create a white background
            background = Image.new('RGB', input_image.size, (255, 255, 255))
            # Paste the image on the background using alpha channel as mask
            background.paste(input_image, mask=input_image.split()[3] if 'A' in input_image.mode else None)
            input_image = background
            logging.info("Converted transparent image to white background for JPEG output")
        
        # Save the processed image to a BytesIO object
        output_buffer = io.BytesIO()
        
        # Save with optimized settings for maximum compression while preserving quality
        save_options = {
            'format': output_format,
            'optimize': True
        }
        
        # Add format-specific options for better compression
        if output_format == 'PNG':
            # For PNG, use maximum compression level
            save_options['compress_level'] = 9
            # Use quantization to reduce colors if needed for large PNGs
            if original_size > 3 * 1024 * 1024:  # If over 3MB
                try:
                    # Quantize to reduce colors while maintaining quality
                    input_image = input_image.quantize(colors=256, method=2).convert('RGBA')
                    logging.info("Applied color quantization to reduce PNG size")
                except Exception as e:
                    logging.warning(f"Could not quantize image: {str(e)}")
        elif output_format == 'JPEG':
            # For JPEG, use optimized quality settings
            save_options['quality'] = quality
            save_options['subsampling'] = 2  # Balanced subsampling for better compression
            save_options['progressive'] = True  # Progressive loading
            
            # For larger images, adjust quality based on file size
            if original_size > 5 * 1024 * 1024:  # If over 5MB
                save_options['quality'] = min(quality, 80)  # Cap at 80
            elif original_size > 2 * 1024 * 1024:  # If over 2MB
                save_options['quality'] = min(quality, 85)  # Cap at 85
        
        logging.info(f"Saving with options: {save_options}")
        input_image.save(output_buffer, **save_options)
        
        # Get the compressed image bytes
        output_buffer.seek(0)
        compressed_image = output_buffer.getvalue()
        compressed_size = len(compressed_image)
        
        # Calculate compression ratio
        compression_ratio = (1 - (compressed_size / original_size)) * 100
        logging.info(f"Compression result: {compressed_size/1024:.2f}KB, ratio: {compression_ratio:.2f}%")
        
        # Convert to base64 for response
        import base64
        base64_image = base64.b64encode(compressed_image).decode('utf-8')
        
        response_data = {
            "success": True,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{compression_ratio:.2f}%",
            "width": input_image.width,
            "height": input_image.height,
            "format": output_format,
            "image_base64": base64_image,
            "original_format": original_format,
            "original_mode": original_mode
        }
        
        logging.info(f"Successfully processed image: {image.filename}")
        return response_data
        
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
