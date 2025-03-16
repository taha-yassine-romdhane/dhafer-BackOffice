"use client";

import { useCallback, useState } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";

interface UploadThingProps {
  color: string;
  onImagesChange: (urls: string[], keys: string[]) => void;
}

export default function UploadThingDropzone({ color, onImagesChange }: UploadThingProps) {
  const [files, setFiles] = useState<{
    url: string;
    key: string;
    preview: string;
  }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append("files", file);
      });

      try {
        // Create an endpoint URL for the specific file route
        const endpointUrl = `/api/uploadthing/productImageUploader`;

        // For each file, create a separate request
        const uploadPromises = acceptedFiles.map(async (file) => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          const res = await fetch(endpointUrl, {
            method: "POST",
            body: fileFormData,
          });

          if (!res.ok) {
            throw new Error(`Upload failed with status: ${res.status}`);
          }

          const data = await res.json();
          return data;
        });

        const results = await Promise.all(uploadPromises);

        // Process the results
        const newFiles = results.map((result, index) => ({
          url: result.url,
          key: result.key,
          preview: URL.createObjectURL(acceptedFiles[index]),
        }));

        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        
        // Extract URLs and keys for parent component
        const allFiles = [...files, ...newFiles];
        onImagesChange(
          allFiles.map((f) => f.url),
          allFiles.map((f) => f.key)
        );
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to upload images");
      } finally {
        setIsUploading(false);
      }
    },
    [files, onImagesChange]
  );

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      
      // Notify parent component
      onImagesChange(
        newFiles.map((f) => f.url),
        newFiles.map((f) => f.key)
      );
      
      return newFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(["image"]),
    maxFiles: 10,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Déposez les images ici ..."
            : "Glissez et déposez des images ici, ou cliquez pour sélectionner"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, GIF jusqu'à 4MB
        </p>
        {isUploading && (
          <div className="mt-4">
            <div className="animate-pulse text-sm text-indigo-600">
              Téléchargement en cours...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {files.map((file, index) => (
            <div
              key={file.key}
              className="relative group border rounded-md overflow-hidden"
            >
              <div className="aspect-square relative">
                <Image
                  src={file.preview}
                  alt={`Image ${index + 1} for ${color}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-xs py-1 text-center">
                  Image principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
