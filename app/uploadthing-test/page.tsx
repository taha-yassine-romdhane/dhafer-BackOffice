'use client';

import { useState } from 'react';
import { UploadButton, UploadDropzone } from '@/utils/uploadthing';

export default function UploadthingTest() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">UploadThing Test Page</h1>
        
        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
          <p className="mb-2">Check your browser console (F12) for detailed logs.</p>
          <p className="mb-2">Upload Status: {uploadStatus || 'Not started'}</p>
          <p>Environment Variables: {process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'}</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Button</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <UploadButton
              endpoint="productImageUploader"
              appearance={{
                button: {
                  background: "#4F46E5",
                  padding: "10px 20px",
                  borderRadius: "8px",
                },
                container: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }
              }}
              onBeforeUploadBegin={(files) => {
                console.log("Before upload begin:", files);
                setIsUploading(true);
                setUploadStatus('Starting upload...');
                return files;
              }}
              onUploadProgress={(progress) => {
                console.log("Upload progress:", progress);
                setUploadStatus(`Uploading: ${progress}%`);
              }}
              onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                setIsUploading(false);
                setUploadStatus('Upload completed successfully');
                if (res) {
                  // Debug the response structure
                  console.log("Response structure:", JSON.stringify(res[0], null, 2));
                  
                  // Try both url properties to ensure compatibility
                  setUploadedUrls(res.map(file => file.ufsUrl || file.url));
                }
                alert("Upload Completed");
              }}
              onUploadError={(error: Error) => {
                console.error("ERROR: ", error);
                setIsUploading(false);
                setUploadStatus(`Upload failed: ${error.message}`);
                setError(error.message);
                alert(`ERROR! ${error.message}`);
              }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Dropzone</h2>
          <UploadDropzone
            endpoint="productImageUploader"
            appearance={{
              container: {
                border: "2px dashed #E5E7EB",
                borderRadius: "8px",
                padding: "20px",
                background: "#F9FAFB"
              },
              button: {
                background: "#4F46E5",
                padding: "10px 20px",
                borderRadius: "8px",
              },
              label: {
                color: "#374151",
                fontSize: "16px",
                fontWeight: "500"
              }
            }}
            onBeforeUploadBegin={(files) => {
              console.log("Before upload begin:", files);
              setIsUploading(true);
              setUploadStatus('Starting upload...');
              return files;
            }}
            onUploadProgress={(progress) => {
              console.log("Upload progress:", progress);
              setUploadStatus(`Uploading: ${progress}%`);
            }}
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              setIsUploading(false);
              setUploadStatus('Upload completed successfully');
              if (res) {
                // Debug the response structure
                console.log("Response structure:", JSON.stringify(res[0], null, 2));
                
                // Try both url properties to ensure compatibility
                setUploadedUrls(res.map(file => file.ufsUrl || file.url));
              }
              alert("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              console.error("ERROR: ", error);
              setIsUploading(false);
              setUploadStatus(`Upload failed: ${error.message}`);
              setError(error.message);
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>

        {isUploading && (
          <div className="mb-8 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <h2 className="text-xl font-semibold mb-2">Uploading...</h2>
            <p>{uploadStatus}</p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        )}

        {uploadedUrls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Uploaded Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="border rounded overflow-hidden">
                  <img src={url} alt={`Uploaded ${index + 1}`} className="w-full h-48 object-cover" />
                  <div className="p-2 break-all">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                      {url}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
