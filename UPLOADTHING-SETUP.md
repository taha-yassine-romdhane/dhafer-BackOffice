# UploadThing Integration Guide

This guide explains how to set up and use UploadThing for image uploads in the Dhafer BackOffice application.

## Setup Instructions

### 1. Install Required Dependencies

Run the following command to install the necessary packages:

```bash
npm install uploadthing @uploadthing/react react-dropzone
```

### 2. Environment Variables

Make sure to add the following environment variables to your `.env` file:

```
UPLOADTHING_SECRET=your_secret_here
UPLOADTHING_APP_ID=your_app_id_here
UPLOADTHING_TOKEN=your_token_here
```

You can get these values from your UploadThing dashboard after creating an account at [uploadthing.com](https://uploadthing.com).

### 3. Configuration Files

The following files have been created/modified to support UploadThing:

- `app/api/uploadthing/core.ts`: Core configuration for UploadThing
- `app/api/uploadthing/route.ts`: API route handler for UploadThing
- `components/uploadthing.tsx`: UploadThing dropzone component
- `app/admin/products/new/page.tsx`: Updated to use UploadThing for image uploads
- `app/api/admin/products/route.ts`: Updated to handle the new image upload flow

## How It Works

1. We're using the official UploadThing React components for file uploads:
   ```tsx
   import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
   
   // In your component:
   <UploadDropzone
     endpoint="productImageUploader"
     onClientUploadComplete={(res) => {
       // Handle successful uploads
       console.log("Files: ", res);
     }}
     onUploadError={(error: Error) => {
       // Handle errors
       console.error("Upload error:", error.message);
     }}
   />
   ```

2. After successful upload, the component returns the URLs of the uploaded images
3. These URLs are stored in the product's color variant data
4. When creating a product, the API uses these URLs directly without additional upload steps

## Stock Management

The stock model has been simplified to track only whether a product is in stock by size and color:

- The `inStock` boolean field replaces the previous `quantity` and `location` fields
- Each size/color combination has a single stock entry with an `inStock` status
- The product creation page now includes checkboxes to mark sizes as in stock for each color variant

## Troubleshooting

If you encounter issues with UploadThing:

1. Check that your environment variables are correctly set
2. Ensure you have the latest version of the UploadThing packages
3. Check the browser console and server logs for error messages
4. Verify that your UploadThing account has sufficient quota for your uploads

For more information, refer to the [UploadThing documentation](https://docs.uploadthing.com/).
