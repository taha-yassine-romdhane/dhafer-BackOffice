# Image Compression Microservice

A Python-based microservice for optimizing and compressing images before uploading them to ImageKit.

## Features

- Resizes large images while maintaining aspect ratio
- Compresses images to reduce file size
- Preserves image orientation based on EXIF data
- Supports multiple image formats (PNG, JPEG)
- Returns base64-encoded optimized images
- Simple REST API interface

## API Endpoints

### GET /

Health check endpoint to verify the service is running.

### POST /compress

Compresses and optimizes an uploaded image.

**Parameters:**
- `image`: The image file to compress (required)
- `max_width`: Maximum width in pixels (default: 1920)
- `max_height`: Maximum height in pixels (default: 1920)
- `quality`: Compression quality (0-100, default: 85)
- `format`: Output format ("PNG" or "JPEG", default: "PNG")

**Response:**
```json
{
  "success": true,
  "original_size_kb": 5000,
  "compressed_size_kb": 800,
  "compression_ratio": "84.00%",
  "width": 1500,
  "height": 1200,
  "format": "PNG",
  "image_base64": "base64_encoded_image_data"
}
```

## Setup and Installation

### Using Docker

1. Build and start the service:
```
cd image-service
docker-compose up -d
```

2. The service will be available at http://localhost:8000

### Manual Setup

1. Install dependencies:
```
pip install -r requirements.txt
```

2. Run the service:
```
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Integration with Next.js

To use this service in your Next.js application, update your upload route to call this microservice before uploading to ImageKit.
