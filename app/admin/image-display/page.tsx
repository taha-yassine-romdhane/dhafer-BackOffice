'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, Trash, Image as ImageIcon, Check } from 'lucide-react';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';   

interface CarouselImage {
  id: string;
  url: string;
  section: 'about' | 'topvente1' | 'topvente2' | 'SliderHome' | 'SliderPromo' | 'SliderTopVente' | 'SliderTopVenteMobile' | 'SliderHomeMobile' | 'SliderPromoMobile';
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
  const [selectedSection, setSelectedSection] = useState<'about' | 'topvente1' | 'topvente2' | 'SliderHome' | 'SliderPromo' | 'SliderTopVente' | 'SliderTopVenteMobile' | 'SliderHomeMobile' | 'SliderPromoMobile'>('about');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [uploadedSectionName, setUploadedSectionName] = useState('');

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
      setUploadedSectionName(getSectionDisplayName(selectedSection));
      setSuccessDialogOpen(true);
      toast.success('Image téléchargée avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setImageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      const response = await fetch(`/api/admin/carousel-images?id=${imageToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      await fetchUploadedImages();
      toast.success('Image supprimée avec succès');
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      toast.error('Échec de la suppression de l\'image');
    }
  };

  const getSectionImages = (section: 'about' | 'topvente1' | 'topvente2' | 'SliderHome' | 'SliderPromo' | 'SliderTopVente' | 'SliderTopVenteMobile' | 'SliderHomeMobile' | 'SliderPromoMobile') => {
    return uploadedImages.filter(img => img.section === section);
  };
  
  const getSectionDisplayName = (section: 'about' | 'topvente1' | 'topvente2' | 'SliderHome' | 'SliderPromo' | 'SliderTopVente' | 'SliderTopVenteMobile' | 'SliderHomeMobile' | 'SliderPromoMobile') => {
    const sectionMap = {
      'about': 'À Propos',
      'topvente1': 'Top Vente 1',
      'topvente2': 'Top Vente 2',
      'SliderHome': 'Slider Home',
      'SliderPromo': 'Slider Promo',
      'SliderTopVente': 'Slider Top Vente',
      'SliderTopVenteMobile': 'Slider Top Vente Mobile',
      'SliderHomeMobile': 'Slider Home Mobile',
      'SliderPromoMobile': 'Slider Promo Mobile'
    };
    return sectionMap[section] || section;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des images Carousel</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ajouter une nouvelle image</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            selectionner une section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="about">À Propos</option>
            <option value="topvente1">Top Vente 1</option>
            <option value="topvente2">Top Vente 2</option>
            <option value="SliderHome">Slider Home</option>
            <option value="SliderPromo">Slider Promo</option>
            <option value="SliderTopVente">Slider Top Vente</option>
            <option value="SliderTopVenteMobile">Slider Top Vente Mobile</option>
            <option value="SliderHomeMobile">Slider Home Mobile</option>
            <option value="SliderPromoMobile">Slider Promo Mobile</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            selectionner une image
          </label>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 rounded-md px-4 py-8 w-full flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm text-gray-600">Cliquez pour select une image</span>
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
        <h2 className="text-xl font-semibold mb-4">Images actuelles</h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section À Propos</h3>
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
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
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
          <h3 className="text-lg font-medium mb-3">Section Top Vente 1</h3>
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
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
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
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Top Vente 2</h3>
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
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* New Slider Sections */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Slider Home</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 600px</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderHome')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Slider Promo</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 600px</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderPromo')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Slider Top Vente</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 600px</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderTopVente')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Slider Home Mobile</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 753px</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderHomeMobile')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Section Slider Promo Mobile</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 753px</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderPromoMobile')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Section Slider Top Vente Mobile</h3>
          <p className="text-sm text-gray-500 mb-2">Images optimales: format 1920px × 753px</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {uploadedImages
                  .filter((img) => img.section === 'SliderTopVenteMobile')
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[1920/600] relative rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.filename}
                          fill
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
   
    
        {/* delete Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette image ? Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Success Dialog */}
    <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Image téléchargée avec succès</DialogTitle>
          <DialogDescription>
            Votre image a été téléchargée avec succès dans la section {uploadedSectionName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setSuccessDialogOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
)
}