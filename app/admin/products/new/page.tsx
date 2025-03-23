'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Plus } from 'lucide-react';
import { UploadDropzone } from '@/utils/uploadthing';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Stock, ProductImage } from '@/lib/types';
import { SIZE_GROUPS } from '@/lib/constants';

const CATEGORY_GROUPS = [
  {
    label: "Femme",
    categories: ["abaya", "pull", "pantalon", "jebba"]
  },
  {
    label: "Enfants",
    categories: ["enfants-pull", "enfants-pantalon", "enfants-jebba", "enfants-abaya"]
  },
  {
    label: "Accessoires",
    categories: ["chachia", "pochette", "eventaille", "foulard"]
  }
];

export interface ColorVariantImages {
  id: number;
  color: string;
  colorVariantId: number;
  images: ProductImage[];
  previewUrls: string[];
  stocks: Stock[];
}
export interface FormData {
  name: string;
  description: string;
  price: string;
  salePrice: string | null;
  categoryGroup: string;
  category: string;
  sizes: string[];
  collaborateur: string | null;
  colorVariants: ColorVariantImages[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [currentColor, setCurrentColor] = useState<string>('');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    salePrice: null,
    categoryGroup: '',
    category: '',
    sizes: [],
    collaborateur: null,
    colorVariants: [],
  });

  // Handle category group change
  const handleCategoryGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const group = e.target.value;
    setSelectedCategoryGroup(group);
    setFormData(prev => ({
      ...prev,
      categoryGroup: group,
      category: '', // Reset category when group changes
      sizes: [] // Reset sizes when group changes
    }));
  };

  // Add a new color variant
  const addColorVariant = () => {
    if (!currentColor.trim()) {
      setError('Veuillez entrer un nom de couleur');
      return;
    }

    if (formData.colorVariants.some(cv => cv.color.toLowerCase() === currentColor.toLowerCase())) {
      setError('Cette couleur existe déjà');
      return;
    }

    setFormData(prev => ({
      ...prev,
      colorVariants: [...prev.colorVariants, {
        color: currentColor,
        images: [],
        previewUrls: [],
        stocks: [],
        id: Date.now(), // Using timestamp as a unique number
        colorVariantId: Date.now() + Math.random(), // Using timestamp plus random number to ensure uniqueness
      }]
    }));
    setCurrentColor('');
    setError('');
  };





  // Remove a color variant
  const removeColorVariant = (colorIndex: number) => {
    setFormData(prev => {
      const updatedColorVariants = [...prev.colorVariants];
      // Revoke all preview URLs for this color
      updatedColorVariants[colorIndex].previewUrls.forEach(url => URL.revokeObjectURL(url));
      updatedColorVariants.splice(colorIndex, 1);
      return { ...prev, colorVariants: updatedColorVariants };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.name.trim()) throw new Error('Product name is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.price) throw new Error('Price is required');
      if (!formData.category) throw new Error('Category is required');
      if (formData.sizes.length === 0) throw new Error('At least one size is required');
      if (formData.colorVariants.length === 0) throw new Error('At least one color variant is required');

      // Check if each color variant has at least one image
      formData.colorVariants.forEach(cv => {
        if (cv.images.length === 0) {
          throw new Error(`Color ${cv.color} needs at least one image`);
        }
      });

      // With UploadThing, images are already uploaded, so we just need to prepare the data
      const colorVariantsWithUrls = formData.colorVariants.map(colorVariant => ({
        color: colorVariant.color,
        images: colorVariant.images,
        stocks: colorVariant.stocks
      }));

      // Create product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        category: formData.category,
        sizes: formData.sizes,
        collaborateur: formData.collaborateur || null,
        colorVariants: colorVariantsWithUrls
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ajouter un nouveau produit</h1>
        <p className="text-gray-600">Créez un nouveau produit avec plusieurs variantes de couleur</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Informations sur le produit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Groupe de Categorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Groupe de Categorie *
              </label>
              <select
                value={selectedCategoryGroup}
                onChange={handleCategoryGroupChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">-- Sélectionnez un groupe --</option>
                {CATEGORY_GROUPS.map(group => (
                  <option key={group.label} value={group.label}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={!selectedCategoryGroup}
              >
                <option value="">-- Sélectionnez une categorie --</option>
                {selectedCategoryGroup &&
                  CATEGORY_GROUPS
                    .find(group => group.label === selectedCategoryGroup)
                    ?.categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace(/-/g, ' ')}
                      </option>
                    ))
                }
              </select>
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix (TND) *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">TND</span>
                </div>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="block w-full pl-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Prix de vente */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix de vente (TND)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">TND</span>
                </div>
                <input
                  type="number"
                  value={formData.salePrice !== null ? formData.salePrice : ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  className="block w-full pl-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <RichTextarea
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                maxLength={2000}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Vous pouvez utiliser des emojis et du texte formaté pour décrire votre produit.
              </p>
            </div>

            {/* Tailles */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Tailles *
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCategoryGroup && SIZE_GROUPS[selectedCategoryGroup as keyof typeof SIZE_GROUPS]?.map((size) => (
                  <label key={size} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sizes.includes(size)}
                      onChange={(e) => {
                        const updatedSizes = e.target.checked
                          ? [...formData.sizes, size]
                          : formData.sizes.filter(s => s !== size);
                        setFormData(prev => ({ ...prev, sizes: updatedSizes }));
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Collaborateur */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Collaborateur
              </label>
              <input
                type="text"
                value={formData.collaborateur || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, collaborateur: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Variants Couleurs Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Variants Couleurs</h2>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                placeholder="Nom de la couleur"
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addColorVariant}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {formData.colorVariants.map((colorVariant, colorIndex) => (
            <div key={colorVariant.color} className="mb-6 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium capitalize">{colorVariant.color}</h3>
                <button
                  type="button"
                  onClick={() => removeColorVariant(colorIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Images for {colorVariant.color}</h3>
                <UploadDropzone
                  endpoint="productImageUploader"
                  appearance={{
                    container: {
                      minHeight: "200px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #E5E7EB",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      backgroundColor: "#F9FAFB"
                    },
                    button: {
                      background: "#4F46E5",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      marginTop: "10px",
                      fontWeight: "500"
                    },
                    label: {
                      color: "#374151",
                      fontSize: "16px",
                      fontWeight: "500"
                    }
                  }}
                  onClientUploadComplete={(res) => {
                    console.log("Upload completed:", res);
                    if (!res || res.length === 0) {
                      console.error("No response from upload");
                      return;
                    }
                    
                    // Create a copy of the uploaded images
                    const uploadedImages = res.map((file, idx) => {
                      console.log("Processing file:", file);
                      return {
                        url: file.ufsUrl || file.url, // Try both properties to ensure compatibility
                        position: idx === 0 ? 'front' : idx === 1 ? 'back' : 'side',
                        isMain: idx === 0,
                        id: Date.now() + idx,
                        colorVariantId: colorVariant.colorVariantId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      };
                    });
                    
                    // Update the form data with the new images
                    setFormData(prev => {
                      const updatedColorVariants = [...prev.colorVariants];
                      const urls = res.map(file => file.ufsUrl || file.url).filter(Boolean);
                      
                      if (urls.length === 0) {
                        console.error("No valid URLs found in response");
                        return prev;
                      }
                      
                      updatedColorVariants[colorIndex] = {
                        ...updatedColorVariants[colorIndex],
                        // Append new images to existing ones instead of replacing
                        images: [...updatedColorVariants[colorIndex].images, ...uploadedImages],
                        // Append new preview URLs to existing ones
                        previewUrls: [...updatedColorVariants[colorIndex].previewUrls, ...urls]
                      };
                      
                      return { ...prev, colorVariants: updatedColorVariants };
                    });
                  }}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error);
                    setError(`Upload error: ${error.message}`);
                  }}
                />
                
                {/* Display preview images */}
                {colorVariant.previewUrls && colorVariant.previewUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Preview Images ({colorVariant.previewUrls.length})</h4>
                    <div className="flex flex-wrap gap-3">
                      {colorVariant.previewUrls.map((url, idx) => (
                        <div key={idx} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                          <img 
                            src={url} 
                            alt={`Preview ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            onClick={() => {
                              setFormData(prev => {
                                const updatedColorVariants = [...prev.colorVariants];
                                const updatedImages = [...updatedColorVariants[colorIndex].images];
                                const updatedUrls = [...updatedColorVariants[colorIndex].previewUrls];
                                
                                updatedImages.splice(idx, 1);
                                updatedUrls.splice(idx, 1);
                                
                                updatedColorVariants[colorIndex] = {
                                  ...updatedColorVariants[colorIndex],
                                  images: updatedImages,
                                  previewUrls: updatedUrls
                                };
                                
                                return { ...prev, colorVariants: updatedColorVariants };
                              });
                            }}
                          >
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
                            {colorVariant.images[idx]?.isMain ? 'Main' : idx === 1 ? 'Back' : `Side ${idx-1}`}
                          </div>
                          {!colorVariant.images[idx]?.isMain && (
                            <button
                              type="button"
                              className="absolute top-1 left-1 bg-indigo-500 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setFormData(prev => {
                                  const updatedColorVariants = [...prev.colorVariants];
                                  const updatedImages = updatedColorVariants[colorIndex].images.map((img, imgIdx) => ({
                                    ...img,
                                    isMain: imgIdx === idx, // Set current image as main, others as not main
                                    position: imgIdx === idx ? 'front' : img.position // Update position if needed
                                  }));
                                  
                                  updatedColorVariants[colorIndex] = {
                                    ...updatedColorVariants[colorIndex],
                                    images: updatedImages
                                  };
                                  
                                  return { ...prev, colorVariants: updatedColorVariants };
                                });
                              }}
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Management Section */}
              {formData.sizes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Disponibilité par taille</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {formData.sizes.map((size) => {
                      // Find existing stock for this size/color
                      const existingStock = colorVariant.stocks.find(s => s.size === size);
                      
                      return (
                        <div key={size} className="flex items-center space-x-2 border rounded-md p-2">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={existingStock ? existingStock.inStock : false}
                              onChange={(e) => {
                                setFormData(prev => {
                                  const updatedColorVariants = [...prev.colorVariants];
                                  const variantStocks = [...updatedColorVariants[colorIndex].stocks];
                                  
                                  const stockIndex = variantStocks.findIndex(s => s.size === size);
                                  
                                  if (stockIndex >= 0) {
                                    // Update existing stock
                                    variantStocks[stockIndex] = {
                                      ...variantStocks[stockIndex],
                                      inStock: e.target.checked
                                    };
                                  } else {
                                    // Create new stock entry
                                    variantStocks.push({
                                      id: Date.now() + Math.random(),
                                      size: size,
                                      inStock: e.target.checked,
                                      colorId: colorVariant.colorVariantId,
                                      productId: 0, // Will be set by the API
                                      createdAt: new Date(),
                                      updatedAt: new Date()
                                    });
                                  }
                                  
                                  updatedColorVariants[colorIndex] = {
                                    ...updatedColorVariants[colorIndex],
                                    stocks: variantStocks
                                  };
                                  
                                  return { ...prev, colorVariants: updatedColorVariants };
                                });
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{size}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boutons de soumission */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            {loading ? 'Création...' : 'Créer le produit'}
          </button>
        </div>
      </form>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              // Handle delete logic here
              setIsDeleting(true);
              // Simulate delete operation
              setTimeout(() => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
                // Show success message or redirect
              }, 1000);
            }} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
