from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ExifTags
import io
import uvicorn
import os
from typing import Optional
import base64

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
        
        # Create a BytesIO object from the original image data
        image_bytes = io.BytesIO(contents)
        
        # Open the image without any processing
        input_image = Image.open(image_bytes)
        
        # Get original size
        original_width, original_height = input_image.size
        original_size = len(contents)
        
        # Check for EXIF orientation
        orientation = None
        if format.upper() == 'JPEG' or (image.content_type and 'jpeg' in image.content_type.lower()):
            try:
                if hasattr(input_image, '_getexif') and input_image._getexif():
                    exif = input_image._getexif()
                    for tag, tag_value in ExifTags.TAGS.items():
                        if tag_value == 'Orientation':
                            if tag in exif:
                                orientation = exif[tag]
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": f"Error reading EXIF: {e}"})
        
        # Apply the correct rotation based on EXIF orientation
        if orientation:
            if orientation == 8:  # Rotation 90 degrees
                input_image = input_image.transpose(Image.ROTATE_90)
                original_width, original_height = original_height, original_width
            elif orientation == 3:  # Rotation 180 degrees
                input_image = input_image.transpose(Image.ROTATE_180)
            elif orientation == 6:  # Rotation 270 degrees
                input_image = input_image.transpose(Image.ROTATE_270)
                original_width, original_height = original_height, original_width
        
        # Resize if necessary
        if original_width > max_width or original_height > max_height:
            ratio = min(max_width / original_width, max_height / original_height)
            new_width = int(original_width * ratio)
            new_height = int(original_height * ratio)
            input_image = input_image.resize((new_width, new_height), Image.LANCZOS)
        
        # Convert to RGB if RGBA (for JPEG compatibility)
        if input_image.mode == 'RGBA' and format.upper() == 'JPEG':
            input_image = input_image.convert('RGB')
        
        # Create a new BytesIO object for the output
        output_buffer = io.BytesIO()
        
        # Save with format-specific settings
        if format.upper() == 'JPEG':
            input_image.save(output_buffer, format='JPEG', quality=quality, optimize=True, subsampling=0)
        elif format.upper() == 'PNG':
            input_image.save(output_buffer, format='PNG', optimize=True, compress_level=9)
        else:
            input_image.save(output_buffer, format=format.upper(), quality=quality, optimize=True)
        
        # Get the compressed image bytes
        output_buffer.seek(0)
        compressed_image = output_buffer.getvalue()
        compressed_size = len(compressed_image)
        
        # Calculate compression ratio
        compression_ratio = (1 - (compressed_size / original_size)) * 100 if original_size > 0 else 0
        
        # Convert to base64 for response
        base64_image = base64.b64encode(compressed_image).decode('utf-8')
        
        # Return response with detailed information
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
            "image": base64_image
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
