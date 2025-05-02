'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, Trash, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CarouselImage {
  id: string;
  url: string;
  section: 'about' | 'topvente1' | 'topvente2';
  filename: string;
  createdAt: string;
}

export default function ImageDisplayPage() {
  // Client-side hardcoded image paths from the components
  const [aboutImages] = useState<string[]>([
  ]);
  
  const [topVente1Images] = useState<string[]>([
  ]);
  
  const [topVente2Images] = useState<string[]>([
  ]);
  const [uploadedImages, setUploadedImages] = useState<CarouselImage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<'about' | 'topvente1' | 'topvente2'>('about');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  const fetchUploadedImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/carousel-images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      console.log('API Response:', data); // Debug the API response
      
      if (data.carouselImages && Array.isArray(data.carouselImages)) {
        setUploadedImages(data.carouselImages);
      } else {
        console.error('Invalid carousel images data:', data.carouselImages);
        setUploadedImages([]);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Upload the image to ImageKit using your existing API
      const uploadFormData = new FormData();
      uploadFormData.append('images', selectedFile);
      uploadFormData.append('positions', selectedSection);

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      if (!uploadData.success || !uploadData.images || !uploadData.images[0]) {
        throw new Error('Failed to upload image');
      }

      const imageUrl = uploadData.images[0].url;
      
      // Save to database
      const saveResponse = await fetch('/api/admin/carousel-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: imageUrl,
          title: null,
          description: null,
          buttonText: null,
          buttonLink: null,
          position: 0,
          isActive: true,
          section: selectedSection,
          filename: selectedFile.name,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save image to database');
      }

      // Refresh the list
      await fetchUploadedImages();

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show success message
      alert(`Image uploaded successfully to ${selectedSection} section!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/admin/carousel-images?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      await fetchUploadedImages();
      alert('Image deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const getSectionImages = (section: 'about' | 'topvente1' | 'topvente2') => {
    switch (section) {
      case 'about':
        return aboutImages;
      case 'topvente1':
        return topVente1Images;
      case 'topvente2':
        return topVente2Images;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Carousel Image Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Image</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="about">À Propos</option>
            <option value="topvente1">Top Vente 1</option>
            <option value="topvente2">Top Vente 2</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image
          </label>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 rounded-md px-4 py-8 w-full flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm text-gray-600">Click to select an image</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </label>
            
            {previewUrl && (
              <div className="relative w-24 h-24">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-md"
                />
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className={`px-4 py-2 rounded-md text-white ${
            uploading || !selectedFile
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Image'
          )}
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Current Images</h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">À Propos Section</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'about')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                
                {/* Show hardcoded images */}
                {aboutImages.map((src, index) => (
                  <div key={`about-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={src}
                        alt={`About image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-full">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Top Vente 1 Section</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'topvente1')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                
                {/* Show hardcoded images */}
                {topVente1Images.map((src, index) => (
                  <div key={`topvente1-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={src}
                        alt={`Top Vente 1 image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-full">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Top Vente 2 Section</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'topvente2')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                
                {/* Show hardcoded images */}
                {topVente2Images.map((src, index) => (
                  <div key={`topvente2-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={src}
                        alt={`Top Vente 2 image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-full">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}