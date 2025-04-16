from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, ExifTags
import io
import uvicorn
import os
from typing import Optional
import logging
import math

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="Image Compression Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def optimize_image_quality(img: Image.Image, target_size_kb: int = 2000, max_attempts: int = 5) -> bytes:
    """
    Optimize image quality to stay under target size while maintaining maximum quality.
    Uses binary search to find the optimal quality setting.
    """
    format = img.format or 'JPEG'
    output_buffer = io.BytesIO()
    
    if format.upper() == 'PNG':
        # For PNG, we'll use optimized compression
        img.save(output_buffer, format='PNG', optimize=True, compress_level=9)
        result = output_buffer.getvalue()
        
        # If still too large, try converting to WebP
        if len(result) > target_size_kb * 1024:
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='WEBP', quality=95, method=6)
            result = output_buffer.getvalue()
            format = 'WEBP'
            
        return result, format
    
    # For JPEG/WebP, we'll use quality adjustment
    low = 50
    high = 95
    best_result = None
    best_quality = None
    
    for _ in range(max_attempts):
        quality = (low + high) // 2
        output_buffer = io.BytesIO()
        
        if format.upper() == 'JPEG':
            img.save(output_buffer, format='JPEG', quality=quality, optimize=True, progressive=True)
        else:
            img.save(output_buffer, format='WEBP', quality=quality, method=6)
            
        current_size = len(output_buffer.getvalue())
        
        if current_size <= target_size_kb * 1024:
            best_result = output_buffer.getvalue()
            best_quality = quality
            low = quality + 1  # Try higher quality
        else:
            high = quality - 1  # Try lower quality
            
        if low > high:
            break
    
    # If we didn't find a suitable quality, use the best we have
    if best_result is None:
        quality = 85  # Default fallback
        output_buffer = io.BytesIO()
        if format.upper() == 'JPEG':
            img.save(output_buffer, format='JPEG', quality=quality, optimize=True, progressive=True)
        else:
            img.save(output_buffer, format='WEBP', quality=quality, method=6)
        best_result = output_buffer.getvalue()
        format = 'WEBP' if format.upper() != 'JPEG' else 'JPEG'
    
    return best_result, format

@app.post("/compress")
async def compress_image(
    image: UploadFile = File(...),
    max_size_mb: Optional[float] = Form(2.0)  # Maximum size in MB
):
    try:
        logging.info(f"Processing image: {image.filename}, max size: {max_size_mb}MB")
        
        # Read the uploaded image
        contents = await image.read()
        input_image = Image.open(io.BytesIO(contents))
        
        # Get original metadata
        original_width, original_height = input_image.size
        original_size = len(contents)
        original_format = input_image.format or "UNKNOWN"
        original_mode = input_image.mode
        
        logging.info(f"Original: {original_width}x{original_height}, {original_size/1024:.2f}KB, {original_format}, {original_mode}")
        
        # Fix orientation based on EXIF data
        try:
            if hasattr(input_image, '_getexif') and input_image._getexif() is not None:
                input_image = ImageOps.exif_transpose(input_image)
                logging.info("Applied EXIF orientation correction")
        except Exception as e:
            logging.warning(f"Could not process EXIF data: {str(e)}")
        
        # Handle transparency if converting to JPEG
        if 'A' in input_image.mode and original_format.upper() != 'JPEG':
            background = Image.new('RGB', input_image.size, (255, 255, 255))
            background.paste(input_image, mask=input_image.split()[3] if 'A' in input_image.mode else None)
            input_image = background
            logging.info("Converted transparent image to white background")
        
        # Optimize the image to stay under max size
        compressed_image, output_format = optimize_image_quality(
            input_image, 
            target_size_kb=max_size_mb * 1024
        )
        
        compressed_size = len(compressed_image)
        compression_ratio = (1 - (compressed_size / original_size)) * 100
        
        logging.info(f"Compressed to: {compressed_size/1024:.2f}KB ({compression_ratio:.2f}% reduction) as {output_format}")
        
        # If still too large (shouldn't happen with our algorithm), force WebP
        if compressed_size > max_size_mb * 1024 * 1024:
            output_buffer = io.BytesIO()
            input_image.save(output_buffer, format='WEBP', quality=50, method=6)
            compressed_image = output_buffer.getvalue()
            output_format = 'WEBP'
            compressed_size = len(compressed_image)
            compression_ratio = (1 - (compressed_size / original_size)) * 100
            logging.warning(f"Had to force WebP to meet size requirements: {compressed_size/1024:.2f}KB")
        
        # Convert to base64 for response
        import base64
        base64_image = base64.b64encode(compressed_image).decode('utf-8')
        
        response_data = {
            "success": True,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{compression_ratio:.2f}%",
            "width": original_width,
            "height": original_height,
            "format": output_format,
            "image_base64": base64_image,
            "original_format": original_format,
            "original_mode": original_mode
        }
        
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