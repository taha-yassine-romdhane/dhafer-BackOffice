from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import uvicorn
import os
from typing import Optional
import base64
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

def simple_png_compress(img: Image.Image) -> bytes:
    """
    Simple PNG compression that preserves image appearance and orientation.
    Just uses basic PNG optimization without changing the image.
    """
    # Create a buffer to hold the compressed image
    buffer = io.BytesIO()
    
    # Save as PNG with basic optimization
    img.save(
        buffer, 
        format='PNG',
        optimize=True,
        compress_level=6  # Moderate compression level (1-9)
    )
    
    # Get the compressed image bytes
    buffer.seek(0)
    return buffer.getvalue()

@app.post("/compress")
async def compress_image(image: UploadFile = File(...)):
    try:
        logging.info(f"Processing image: {image.filename}")
        
        # Read the uploaded image
        contents = await image.read()
        if len(contents) > 20 * 1024 * 1024:  # 20MB max input
            raise ValueError("Image too large (max 20MB)")
        
        # Open the image
        img = Image.open(io.BytesIO(contents))
        
        # Preserve original attributes
        original_size = len(contents)
        original_width, original_height = img.size
        original_format = img.format or "UNKNOWN"
        
        logging.info(f"Original image: {original_width}x{original_height}, {original_size/1024:.2f}KB, format: {original_format}")
        
        # Simple PNG compression without changing orientation
        compressed_data = simple_png_compress(img)
        compressed_size = len(compressed_data)
        
        # Calculate compression ratio
        compression_ratio = (1 - (compressed_size / original_size)) * 100
        
        logging.info(f"Compressed to PNG: {compressed_size/1024:.2f}KB, ratio: {compression_ratio:.2f}%")
        
        # Return the compressed image and metadata
        return {
            "success": True,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{compression_ratio:.2f}%",
            "width": original_width,
            "height": original_height,
            "format": "PNG",
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