'use client';

import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface DropzoneProps {
  color: string;
  onImagesChange: (files: File[], previewUrls: string[]) => void;
  existingImages?: { url: string; isMain?: boolean }[];
  className?: string;
}

const Dropzone = ({ color, onImagesChange, existingImages = [], className = '' }: DropzoneProps) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    existingImages.map(img => img.url)
  );
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter(file => {
        // Validate file size (5MB)
        if (file.size > 15 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large. Max size is 15MB`);
          return false;
        }
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          console.warn(`File ${file.name} has unsupported format`);
          return false;
        }
        return true;
      });

      if (validFiles.length !== acceptedFiles.length) {
        console.warn('Some files were skipped due to size or format restrictions');
      }

      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));

      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
      onImagesChange([...files, ...validFiles], [...previewUrls, ...newPreviewUrls]);
    },
    [files, previewUrls, onImagesChange]
  );

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]); // Clean up the URL
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    
    setPreviewUrls(newPreviewUrls);
    setFiles(newFiles);
    onImagesChange(newFiles, newPreviewUrls);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 15 * 1024 * 1024 // 15MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'hover:border-indigo-500'}
          ${className}
          ${!color ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={!color} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {!color 
            ? 'Select a color before uploading images'
            : isDragActive
            ? `Drop images for ${color} here...`
            : `Drop images for ${color} variant or click to select`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          First image will be the main image. Supports: JPG, PNG, WebP (max 15MB each)
        </p>
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={url}
                  alt={`${color} preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm 
                  opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropzone;