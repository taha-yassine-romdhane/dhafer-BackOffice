import { createUploadthing, type FileRouter } from "uploadthing/next";

// Initialize UploadThing
const f = createUploadthing();

// Simple auth function that always allows uploads
// Replace this with your actual auth logic (e.g., checking session, token, etc.)
const auth = () => ({ id: "admin" });

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Route for product images - allows multiple images
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      console.log("Upload middleware running");
      
      // This code runs on your server before upload
      const user = auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      console.log("File key:", file.key);
      console.log("File name:", file.name);
      console.log("File size:", file.size);

      // Return the file URL and additional metadata to the client
      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        key: file.key,
        // Include both URL formats to ensure compatibility
        ufsUrl: file.ufsUrl
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;