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
        # Target size in bytes (100KB)
        TARGET_SIZE = 100 * 1024
        MIN_QUALITY = 20
        MIN_WIDTH = 400
        MIN_HEIGHT = 400
        DOWNSCALE_STEP = 0.9  # Reduce size by 10% each time if needed

        contents = await image.read()
        image_bytes = io.BytesIO(contents)
        input_image = Image.open(image_bytes)
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
            if orientation == 8:
                input_image = input_image.transpose(Image.ROTATE_90)
                original_width, original_height = original_height, original_width
            elif orientation == 3:
                input_image = input_image.transpose(Image.ROTATE_180)
            elif orientation == 6:
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

        # Adaptive compression loop
        cur_quality = quality if quality else 85
        cur_width, cur_height = input_image.width, input_image.height
        compressed_image = None
        compressed_size = 0
        cur_format = format.upper()
        success = False

        for attempt in range(20):  # Prevent infinite loops
            output_buffer = io.BytesIO()
            save_kwargs = {}

            if cur_format == 'JPEG':
                save_kwargs = {'format': 'JPEG', 'quality': cur_quality, 'optimize': True, 'subsampling': 0}
            elif cur_format == 'PNG':
                save_kwargs = {'format': 'PNG', 'optimize': True, 'compress_level': 9}
            else:
                save_kwargs = {'format': cur_format, 'quality': cur_quality, 'optimize': True}

            input_image.save(output_buffer, **save_kwargs)
            output_buffer.seek(0)
            compressed_image = output_buffer.getvalue()
            compressed_size = len(compressed_image)

            if compressed_size <= TARGET_SIZE:
                success = True
                break

            # Step 1: Lower quality if JPEG
            if cur_format == 'JPEG' and cur_quality > MIN_QUALITY:
                cur_quality = max(cur_quality - 10, MIN_QUALITY)
                continue

            # Step 2: If PNG or JPEG at min quality, resize (downscale)
            if cur_width > MIN_WIDTH and cur_height > MIN_HEIGHT:
                cur_width = int(cur_width * DOWNSCALE_STEP)
                cur_height = int(cur_height * DOWNSCALE_STEP)
                input_image = input_image.resize((cur_width, cur_height), Image.LANCZOS)
                continue

            # Step 3: If PNG and still too big, try converting to JPEG
            if cur_format == 'PNG':
                cur_format = 'JPEG'
                if input_image.mode in ('RGBA', 'LA'):
                    input_image = input_image.convert('RGB')
                cur_quality = 85
                continue

            # If all else fails, break
            break

        compression_ratio = (1 - (compressed_size / original_size)) * 100 if original_size > 0 else 0
        base64_image = base64.b64encode(compressed_image).decode('utf-8')

        response_data = {
            "success": success,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{compression_ratio:.2f}%",
            "original_width": original_width,
            "original_height": original_height,
            "width": input_image.width,
            "height": input_image.height,
            "format": cur_format,
            "image": base64_image
        }
        return response_data

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
