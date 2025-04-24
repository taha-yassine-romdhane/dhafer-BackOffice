from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ExifTags
import io
import uvicorn
import os
from typing import List, Optional

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
    format: Optional[str] = Form("PNG"),
    max_width: Optional[int] = Form(1920),
    max_height: Optional[int] = Form(1920)
):
    try:
        # Read the uploaded image
        contents = await image.read()
        input_image = Image.open(io.BytesIO(contents))
        
        # Get original size
        original_width, original_height = input_image.size
        original_size = len(contents)
        
        # Completely disable any automatic rotation
        # Get the original image data without any processing
        original_orientation = None
        
        # Create a fresh copy of the image to prevent any automatic rotation
        # This ensures we're working with the exact image as uploaded
        input_image = Image.open(io.BytesIO(contents))
        
        # Calculate new dimensions while maintaining aspect ratio
        # Only resize if the image exceeds the maximum dimensions
        if original_width > max_width or original_height > max_height:
            # Calculate the ratio
            ratio = min(max_width / original_width, max_height / original_height)
            new_width = int(original_width * ratio)
            new_height = int(original_height * ratio)
            
            # Resize the image using high-quality resampling
            input_image = input_image.resize((new_width, new_height), Image.LANCZOS)
        else:
            # Keep original dimensions if within limits
            new_width, new_height = original_width, original_height
        
        # Convert to RGB if RGBA (for JPEG compatibility)
        if input_image.mode == 'RGBA' and format.upper() == 'JPEG':
            input_image = input_image.convert('RGB')
        
        # Save the processed image to a BytesIO object
        output_buffer = io.BytesIO()
        
        # Save with the specified format and quality
        # Ensure we're preserving the exact dimensions and orientation
        if format.upper() == 'JPEG':
            # For JPEG, explicitly preserve orientation by not writing EXIF
            input_image.save(
                output_buffer, 
                format='JPEG', 
                quality=quality,
                optimize=True,
                subsampling=0,  # Prevent chroma subsampling which can affect appearance
                exif=b''  # Empty EXIF data to prevent any orientation issues
            )
        elif format.upper() == 'PNG':
            # PNG doesn't have orientation issues
            input_image.save(
                output_buffer, 
                format='PNG',
                optimize=True,
                compress_level=9  # Maximum compression
            )
        else:
            input_image.save(
                output_buffer, 
                format=format.upper(), 
                quality=quality,
                optimize=True
            )
        
        # Get the compressed image bytes
        output_buffer.seek(0)
        compressed_image = output_buffer.getvalue()
        compressed_size = len(compressed_image)
        
        # Calculate compression ratio
        compression_ratio = (1 - (compressed_size / original_size)) * 100
        
        # Convert to base64 for response
        import base64
        base64_image = base64.b64encode(compressed_image).decode('utf-8')
        
        response_data = {
            "success": True,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{compression_ratio:.2f}%",
            "original_width": original_width,
            "original_height": original_height,
            "width": input_image.width,
            "height": input_image.height,
            "format": format.upper(),
            "image_base64": base64_image
        }
        
        # Add orientation info if available
        if original_orientation is not None:
            response_data["original_orientation"] = original_orientation
            
        return response_data
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
