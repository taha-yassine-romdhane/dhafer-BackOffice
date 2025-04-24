"""
Simple test script to verify image rotation and compression without FastAPI.
This script will process an image file and save the output in the same directory.
"""
from PIL import Image, ExifTags
import io
import os
import sys
import base64

def process_image(input_path, output_path=None, quality=85, max_width=1920, max_height=1920):
    """
    Process an image file, compress it, and save it to the output path.
    If no output path is provided, it will save in the same directory with '_processed' suffix.
    """
    try:
        # Get the file extension
        _, file_ext = os.path.splitext(input_path)
        file_ext = file_ext.lower()
        
        # Determine format based on extension
        img_format = 'JPEG' if file_ext in ['.jpg', '.jpeg'] else 'PNG'
        
        # Create output path if not provided
        if not output_path:
            base_name = os.path.basename(input_path)
            name_without_ext = os.path.splitext(base_name)[0]
            output_path = os.path.join(os.path.dirname(input_path), 
                                      f"{name_without_ext}_processed{file_ext}")
        
        print(f"Processing image: {input_path}")
        print(f"Output will be saved to: {output_path}")
        print(f"Using format: {img_format}")
        
        # Open the image directly - no EXIF rotation
        with open(input_path, 'rb') as f:
            image_data = f.read()
        
        # Get original size
        original_size = len(image_data)
        print(f"Original file size: {original_size / 1024:.2f} KB")
        
        # Create a BytesIO object from the original image data
        image_bytes = io.BytesIO(image_data)
        
        # Open the image without any processing
        input_image = Image.open(image_bytes)
        
        # Print original dimensions
        original_width, original_height = input_image.size
        print(f"Original dimensions: {original_width}x{original_height}")
        
        # Check for EXIF orientation
        orientation = None
        if img_format == 'JPEG':
            try:
                if hasattr(input_image, '_getexif') and input_image._getexif():
                    exif = input_image._getexif()
                    for tag, tag_value in ExifTags.TAGS.items():
                        if tag_value == 'Orientation':
                            if tag in exif:
                                orientation = exif[tag]
                                print(f"EXIF Orientation: {orientation}")
                            break
            except Exception as e:
                print(f"Error reading EXIF: {e}")
        
        # Create a new image with the same mode and size
        new_image = Image.new(input_image.mode, (original_width, original_height))
        new_image.paste(input_image, (0, 0))
        
        # Use this new image for further processing
        input_image = new_image
        
        # Only resize if the image exceeds the maximum dimensions
        if original_width > max_width or original_height > max_height:
            # Calculate the ratio to maintain aspect ratio
            ratio = min(max_width / original_width, max_height / original_height)
            new_width = int(original_width * ratio)
            new_height = int(original_height * ratio)
            
            print(f"Resizing to: {new_width}x{new_height}")
            # Resize using high-quality resampling
            input_image = input_image.resize((new_width, new_height), Image.LANCZOS)
        
        # Convert to RGB if RGBA (for JPEG compatibility)
        if input_image.mode == 'RGBA' and img_format == 'JPEG':
            input_image = input_image.convert('RGB')
        
        # Save the processed image
        if img_format == 'JPEG':
            input_image.save(output_path, format='JPEG', quality=quality, optimize=True, subsampling=0)
        else:
            input_image.save(output_path, format='PNG', optimize=True, compress_level=9)
        
        # Get the compressed size
        compressed_size = os.path.getsize(output_path)
        print(f"Compressed file size: {compressed_size / 1024:.2f} KB")
        print(f"Compression ratio: {(1 - (compressed_size / original_size)) * 100:.2f}%")
        
        # Also save a version with explicitly preserved orientation
        preserved_output = os.path.join(os.path.dirname(input_path), 
                                      f"{name_without_ext}_preserved{file_ext}")
        
        # For this version, we'll try to preserve the original orientation
        original_image = Image.open(input_path)
        original_image.save(preserved_output)
        
        # Create a version with correct rotation applied
        corrected_output = os.path.join(os.path.dirname(input_path), 
                                      f"{name_without_ext}_corrected{file_ext}")
        
        # Apply the correct rotation based on EXIF orientation
        corrected_image = Image.open(input_path)
        if orientation == 8:  # Rotation 90 degrees
            print(f"Applying 90 degree rotation to correct orientation")
            corrected_image = corrected_image.transpose(Image.ROTATE_90)
        elif orientation == 3:  # Rotation 180 degrees
            corrected_image = corrected_image.transpose(Image.ROTATE_180)
        elif orientation == 6:  # Rotation 270 degrees
            corrected_image = corrected_image.transpose(Image.ROTATE_270)
            
        # Save the corrected image
        corrected_image.save(corrected_output)
        print(f"Also saved a version with original orientation: {preserved_output}")
        
        return {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "preserved_path": preserved_output,
            "corrected_path": corrected_output,
            "original_size_kb": original_size / 1024,
            "compressed_size_kb": compressed_size / 1024,
            "compression_ratio": f"{(1 - (compressed_size / original_size)) * 100:.2f}%",
            "original_width": original_width,
            "original_height": original_height,
            "width": input_image.width,
            "height": input_image.height,
            "format": img_format,
            "orientation": orientation
        }
    except Exception as e:
        print(f"Error processing image: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Prompt for image path
    print("\nImage Rotation Test Tool")
    print("=======================")
    
    # Try to get image path from command line first
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # Otherwise prompt for it
        image_path = input("\nEnter the full path to the image file: ")
    
    # Validate the path
    if not os.path.exists(image_path):
        print(f"Error: File not found at {image_path}")
        print("Please enter a valid file path.")
        sys.exit(1)
    
    # Process the image
    print(f"\nProcessing image at: {image_path}\n")
    result = process_image(image_path)
    
    # Print the result
    if result["success"]:
        print("\nProcessing completed successfully!")
        print(f"Original image: {result['input_path']}")
        print(f"Processed image: {result['output_path']}")
        print(f"Preserved image: {result['preserved_path']}")
        print(f"Corrected image: {result['corrected_path']}")
        
        # Provide instructions for next steps
        print("\nNext steps:")
        print("1. Compare all versions of the image")
        print("2. The 'corrected' version should have the proper orientation applied")
        print("3. If the EXIF orientation is 8, this means the image should be rotated 90 degrees")
        print("4. Use the corrected version as a reference for how the image should appear")
    else:
        print(f"Error: {result['error']}")
