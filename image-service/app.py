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

def smart_compress(img: Image.Image, max_size_bytes: int) -> tuple[bytes, str]:
    """
    Compress image using optimal strategy to stay under max_size_bytes
    Returns (compressed_data, format_used)
    """
    original_mode = img.mode
    formats_to_try = ['WEBP', 'JPEG', 'PNG']  # Ordered by compression efficiency
    
    for fmt in formats_to_try:
        for quality in [85, 75, 65, 55]:  # Quality tiers to try
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
                    else:
                        save_kwargs['progressive'] = True
                
                # Handle transparency if converting to non-alpha format
                if 'A' in original_mode and fmt != 'PNG':
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if 'A' in original_mode else None)
                    img_to_save = background
                else:
                    img_to_save = img
                
                img_to_save.save(buffer, **save_kwargs)
                
                if buffer.tell() <= max_size_bytes:
                    return buffer.getvalue(), fmt
                
            except Exception as e:
                logging.warning(f"Failed to save as {fmt} at quality {quality}: {str(e)}")
                continue
    
    # If all else fails, use minimal WebP
    buffer = io.BytesIO()
    img.save(buffer, format='WEBP', quality=40, method=6)
    return buffer.getvalue(), 'WEBP'

@app.post("/compress")
async def compress_image(
    image: UploadFile = File(...),
    max_size_mb: float = Form(2.0)
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
            
            # Compress with our smart algorithm
            max_size_bytes = int(max_size_mb * 1024 * 1024)
            compressed_data, output_format = smart_compress(img, max_size_bytes)
            compressed_size = len(compressed_data)
            
            # Verify the output
            try:
                Image.open(io.BytesIO(compressed_data)).verify()
            except Exception as verify_err:
                logging.error(f"Compressed image verification failed: {verify_err}")
                raise ValueError("Failed to produce valid image output")
            
            # Calculate results
            compression_ratio = (1 - (compressed_size / original_size)) * 100
            
            return {
                "success": True,
                "original_size_kb": original_size / 1024,
                "compressed_size_kb": compressed_size / 1024,
                "compression_ratio": f"{compression_ratio:.2f}%",
                "width": original_width,
                "height": original_height,
                "format": output_format,
                "original_format": original_format,
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