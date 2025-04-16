from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps
import io
import uvicorn
import os
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="Ultra Image Compression Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def smart_compress(img: Image.Image, target_size_bytes: int) -> tuple[bytes, str, int]:
    """
    Compress image to target around 1MB while preserving appearance
    Returns (compressed_data, format_used, quality_used)
    """
    original_mode = img.mode
    original_width, original_height = img.size
    
    # For fashion product images, JPEG often works best for color preservation
    # But we'll try multiple formats in case one works better for a specific image
    formats_to_try = ['JPEG', 'WEBP', 'PNG']
    
    # First try: high quality compression without resizing
    for fmt in formats_to_try:
        # Try a range of quality settings, starting high for best appearance
        for quality in [95, 90, 85, 80, 75, 70, 65]:
            buffer = io.BytesIO()
            
            try:
                save_kwargs = {
                    'format': fmt,
                    'optimize': True,
                }
                
                if fmt == 'PNG':
                    save_kwargs['compress_level'] = 9
                elif fmt in ['JPEG', 'WEBP']:
                    save_kwargs['quality'] = quality
                    if fmt == 'WEBP':
                        save_kwargs['method'] = 6  # Best compression
                    else:  # JPEG
                        save_kwargs['progressive'] = True
                        save_kwargs['subsampling'] = 0  # Highest quality subsampling
                
                # Handle transparency if converting to non-alpha format
                if 'A' in original_mode and fmt != 'PNG':
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if 'A' in original_mode else None)
                    img_to_save = background
                else:
                    img_to_save = img
                
                img_to_save.save(buffer, **save_kwargs)
                size = buffer.tell()
                
                # Target around 1MB (with some flexibility)
                # We prefer slightly larger files with better quality
                if size <= target_size_bytes * 1.1 and size >= target_size_bytes * 0.8:
                    logging.info(f"Found optimal format {fmt} at quality {quality} with size {size/1024/1024:.2f}MB")
                    return buffer.getvalue(), fmt, quality
                
                # If we're close but too large, we'll remember this option
                if size <= target_size_bytes * 1.5:
                    logging.info(f"Found close match: {fmt} at quality {quality} with size {size/1024/1024:.2f}MB")
                    close_match = (buffer.getvalue(), fmt, quality, size)
                
            except Exception as e:
                logging.warning(f"Failed to save as {fmt} at quality {quality}: {str(e)}")
                continue
    
    # If we found a close match, use it
    if 'close_match' in locals():
        logging.info(f"Using close match: {close_match[1]} at quality {close_match[2]} with size {close_match[3]/1024/1024:.2f}MB")
        return close_match[0], close_match[1], close_match[2]
    
    # If we're still too large, try more aggressive compression
    # We'll use JPEG with lower quality as it usually preserves appearance better
    buffer = io.BytesIO()
    
    # Convert to RGB if needed
    if 'A' in original_mode:
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3] if 'A' in original_mode else None)
        img_to_save = background
    else:
        img_to_save = img.convert('RGB') if img.mode != 'RGB' else img
    
    # Use JPEG with quality 60
    img_to_save.save(buffer, format='JPEG', quality=60, optimize=True, progressive=True)
    return buffer.getvalue(), 'JPEG', 60

@app.post("/compress")
async def compress_image(
    image: UploadFile = File(...),
    target_size_mb: float = Form(1.0)  # Target 1MB by default
):
    try:
        logging.info(f"Processing image: {image.filename}")
        
        # Read and validate input
        contents = await image.read()
        if len(contents) > 20 * 1024 * 1024:  # 20MB max input
            raise ValueError("Image too large (max 20MB)")
        
        with Image.open(io.BytesIO(contents)) as img:
            # Preserve original attributes
            original_size = len(contents)
            original_width, original_height = img.size
            original_format = img.format or "UNKNOWN"
            
            # Fix orientation
            img = ImageOps.exif_transpose(img)
            
            # Compress with our smart algorithm targeting 1MB
            target_size_bytes = int(target_size_mb * 1024 * 1024)
            compressed_data, output_format, quality_used = smart_compress(img, target_size_bytes)
            compressed_size = len(compressed_data)
            
            # Verify the output
            try:
                Image.open(io.BytesIO(compressed_data)).verify()
            except Exception as verify_err:
                logging.error(f"Compressed image verification failed: {verify_err}")
                raise ValueError("Failed to produce valid image output")
            
            # Calculate results
            compression_ratio = (1 - (compressed_size / original_size)) * 100
            
            # Import base64 here to avoid global import
            import base64
            
            # Return detailed information about the compression
            return {
                "success": True,
                "original_size_kb": original_size / 1024,
                "compressed_size_mb": compressed_size / (1024 * 1024),
                "compression_ratio": f"{compression_ratio:.2f}%",
                "width": original_width,
                "height": original_height,
                "format": output_format,
                "quality_used": quality_used,
                "original_format": original_format,
                "image_base64": base64.b64encode(compressed_data).decode('utf-8')
            }
            
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)