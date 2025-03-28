'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Plus } from 'lucide-react';
import { UploadDropzone } from '@/utils/uploadthing';
import { Stock, ProductImage } from '@/lib/types';
import Image from 'next/image';
import { SIZE_GROUPS } from '@/lib/constants';
import { RichTextarea } from '@/components/ui/rich-textarea';
import { generateUUID } from '@/utils/uuid';

const CATEGORY_GROUPS : { label: string; categories: string[] }[] = [
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
  id: string;
  color: string;
  colorVariantId: string;
  images: File[];
  previewUrls: string[];
  existingImages?: ProductImage[];
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

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');

        const { product } = await response.json(); // Note: our API returns { success: true, product: {...} }

        if (!product) {
          throw new Error('Product not found');
        }

        // Find category group based on category
        const categoryGroup = CATEGORY_GROUPS.find(group =>
          group.categories.includes(product.category)
        )?.label || '';

        setSelectedCategoryGroup(categoryGroup);

        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price ? product.price.toString() : '', // Add null check
          salePrice: product.salePrice ? product.salePrice.toString() : null, // Add null check
          categoryGroup: categoryGroup,
          category: product.category || '',
          sizes: product.sizes || [],
          collaborateur: product.collaborateur || null,
          colorVariants: product.colorVariants?.map((cv: any) => ({
            id: cv.id || generateUUID(),
            color: cv.color || '',
            colorVariantId: cv.id || generateUUID(),
            images: [], // New images to be uploaded
            previewUrls: [], // Preview URLs for new images
            existingImages: cv.images || [], // Existing images from the database
            stocks: cv.stocks || []
          })) || []
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      }
    };

    fetchProduct();
  }, [params.productId]);

  // Handle category group change
  const handleCategoryGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const group = e.target.value;
    setSelectedCategoryGroup(group);
    setFormData(prev => ({
      ...prev,
      categoryGroup: group,
      category: '',
      sizes: []
    }));
  };

  // Add a new color variant
  const addColorVariant = () => {
    if (!currentColor.trim()) {
      setError('Please enter a color name');
      return;
    }

    if (formData.colorVariants.some(cv => cv.color.toLowerCase() === currentColor.toLowerCase())) {
      setError('This color already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      colorVariants: [...prev.colorVariants, {
        color: currentColor,
        images: [],
        previewUrls: [],
        existingImages: [],
        stocks: [],
        id: generateUUID(),
        colorVariantId: generateUUID()
      }]
    }));
    setCurrentColor('');
    setError('');
  };

  // Remove a color variant
  const removeColorVariant = (colorIndex: number) => {
    setFormData(prev => {
      const updatedColorVariants = [...prev.colorVariants];
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

      // Process each color variant
      const colorVariantsWithUrls = await Promise.all(
        formData.colorVariants.map(async (colorVariant) => {
          // Combine existing images with newly uploaded images
          // With UploadThing, images are already uploaded, so we just need to prepare the data
          let images = colorVariant.existingImages || [];
          
          // No need to upload images as they're already uploaded with UploadThing
          console.log('Images for color variant:', images);

          // Create stocks data
          const stocksData = formData.sizes.map(size => ({
            inStock: true, // Default to in stock
            size: size
          }));
          
          console.log('Stocks Data:', stocksData);

          // Add before returning the variant
          console.log('Color Variant being created:', {
            color: colorVariant.color,
            images: {
              create: images.map(img => ({
                url: img.url,
                isMain: img.isMain || false,
                position: img.position
              }))
            },
            stocks: {
              create: stocksData
            }
          });

          // Create the variant with the correct structure
          return {
            color: colorVariant.color,
            images: {
              create: images.map(img => ({
                url: img.url,
                isMain: img.isMain || false,
                position: img.position
              }))
            },
            stocks: {
              create: stocksData // Use stocksData directly here
            }
          };
        })
      );

      // Update product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        category: formData.category,
        sizes: formData.sizes,
        collaborateur: formData.collaborateur,
        colorVariants: colorVariantsWithUrls
      };

      const response = await fetch(`/api/products/${params.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-gray-600">Update product details and variants</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Informations du produit</h2>
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

            {/* Category Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Groupe de catégories *
              </label>
              <select
                value={selectedCategoryGroup}
                onChange={handleCategoryGroupChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Choisissez une catégorie</option>
                {CATEGORY_GROUPS.map(group => (
                  <option key={group.label} value={group.label}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={!selectedCategoryGroup}
              >
                <option value="">Choisissez une catégorie</option>
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

            {/* Price */}
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

            {/* Sale Price */}
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

            {/* Sizes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Tailles *
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCategoryGroup && SIZE_GROUPS[selectedCategoryGroup]?.map((size) => (
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

        {/* Variants de couleur Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Variants de couleur</h2>
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
            <div key={colorVariant.id} className="mb-6 border rounded-lg p-4">
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

              {/* Display existing images */}
              {colorVariant.existingImages && colorVariant.existingImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Images existantes ({colorVariant.existingImages.length})</h4>
                  <div className="flex flex-wrap gap-3">
                    {colorVariant.existingImages.map((image, imageIndex) => (
                      <div key={image.id} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                        <div className="relative w-full h-full">
                          <Image
                            src={image.url}
                            alt={`Product ${imageIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const updatedColorVariants = [...prev.colorVariants];
                              updatedColorVariants[colorIndex].existingImages =
                                updatedColorVariants[colorIndex].existingImages?.filter((_, idx) => idx !== imageIndex);
                              return { ...prev, colorVariants: updatedColorVariants };
                            });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm
                            opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
                          {image.isMain ? 'Main' : image.position === 'front' ? 'Front' : image.position === 'back' ? 'Back' : 'Side'}
                        </div>
                        {!image.isMain && (
                          <button
                            type="button"
                            className="absolute top-1 left-1 bg-indigo-500 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData(prev => {
                                const updatedColorVariants = [...prev.colorVariants];
                                // Set all images to not main first
                                const updatedImages = updatedColorVariants[colorIndex].existingImages?.map(img => ({
                                  ...img,
                                  isMain: false // Reset all to false first
                                }));
                                
                                // Then set only the current image as main
                                if (updatedImages && updatedImages[imageIndex]) {
                                  updatedImages[imageIndex] = {
                                    ...updatedImages[imageIndex],
                                    isMain: true,
                                    position: 'front' // Update position if needed
                                  };
                                }
                                
                                if (updatedImages) {
                                  updatedColorVariants[colorIndex].existingImages = updatedImages;
                                }
                                
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
              {/* Upload new images with UploadThing */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Upload New Images for {colorVariant.color}</h4>
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
                      // Ensure colorVariantId is a number
                      const variantId = typeof colorVariant.colorVariantId === 'number' 
                        ? colorVariant.colorVariantId 
                        : typeof colorVariant.id === 'number'
                          ? colorVariant.id
                          : parseInt(colorVariant.id as string, 10) || Date.now();
                          
                      return {
                        url: file.ufsUrl || file.url, // Try both properties to ensure compatibility
                        position: idx === 0 ? 'front' : idx === 1 ? 'back' : 'side',
                        isMain: false, // Default to false, user can set main image later
                        id: Date.now() + idx,
                        colorVariantId: variantId,
                        createdAt: new Date(),
                        updatedAt: new Date()
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
                      
                      // Add the new images to the existing images
                      const currentExistingImages = updatedColorVariants[colorIndex].existingImages || [];
                      updatedColorVariants[colorIndex] = {
                        ...updatedColorVariants[colorIndex],
                        existingImages: [
                          ...currentExistingImages,
                          ...uploadedImages
                        ],
                        // Append new preview URLs to existing ones instead of replacing
                        previewUrls: [
                          ...(updatedColorVariants[colorIndex].previewUrls || []),
                          ...urls
                        ]
                      };
                      
                      return { ...prev, colorVariants: updatedColorVariants };
                    });
                  }}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error);
                    setError(`Upload error: ${error.message}`);
                  }}
                />
              </div>

              {/* Display preview of newly uploaded images */}
              {colorVariant.previewUrls && colorVariant.previewUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Nouvelles images ({colorVariant.previewUrls.length})</h4>
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            setFormData(prev => {
                              const updatedColorVariants = [...prev.colorVariants];
                              const updatedUrls = [...updatedColorVariants[colorIndex].previewUrls];
                              
                              // Get the corresponding image from existingImages that was added during upload
                              const currentExistingImages = [...(updatedColorVariants[colorIndex].existingImages || [])];
                              // Calculate the index in existingImages (it would be after the original existing images)
                              const originalExistingCount = currentExistingImages.length - updatedColorVariants[colorIndex].previewUrls.length;
                              const imageIndexInExisting = originalExistingCount + idx;
                              
                              // Remove from both previewUrls and existingImages
                              updatedUrls.splice(idx, 1);
                              if (imageIndexInExisting >= 0 && imageIndexInExisting < currentExistingImages.length) {
                                currentExistingImages.splice(imageIndexInExisting, 1);
                              }
                              
                              updatedColorVariants[colorIndex] = {
                                ...updatedColorVariants[colorIndex],
                                previewUrls: updatedUrls,
                                existingImages: currentExistingImages
                              };
                              
                              return { ...prev, colorVariants: updatedColorVariants };
                            });
                          }}
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
                          {/* Calculate the index in existingImages */}
                          {(() => {
                            const currentExistingImages = colorVariant.existingImages || [];
                            const originalExistingCount = currentExistingImages.length - colorVariant.previewUrls.length;
                            const imageIndex = originalExistingCount + idx;
                            const image = imageIndex >= 0 && imageIndex < currentExistingImages.length 
                              ? currentExistingImages[imageIndex] 
                              : null;
                              
                            return image?.isMain ? 'Main' : idx === 0 ? 'Front' : idx === 1 ? 'Back' : `Side ${idx-1}`;
                          })()}
                        </div>
                        {/* Add Set as Main button */}
                        {(() => {
                          const currentExistingImages = colorVariant.existingImages || [];
                          const originalExistingCount = currentExistingImages.length - colorVariant.previewUrls.length;
                          const imageIndex = originalExistingCount + idx;
                          const image = imageIndex >= 0 && imageIndex < currentExistingImages.length 
                            ? currentExistingImages[imageIndex] 
                            : null;
                            
                          if (!image?.isMain) {
                            return (
                              <button
                                type="button"
                                className="absolute top-1 left-1 bg-indigo-500 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setFormData(prev => {
                                    const updatedColorVariants = [...prev.colorVariants];
                                    const updatedImages = updatedColorVariants[colorIndex].existingImages?.map((img, imgIdx) => ({
                                      ...img,
                                      isMain: imgIdx === imageIndex, // Set current image as main, others as not main
                                      position: imgIdx === imageIndex ? 'front' : img.position // Update position if needed
                                    }));
                                    
                                    if (updatedImages) {
                                      updatedColorVariants[colorIndex].existingImages = updatedImages;
                                    }
                                    
                                    return { ...prev, colorVariants: updatedColorVariants };
                                  });
                                }}
                              >
                                Set as Main
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
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
            {loading ? 'Mise à jour...' : 'Mettre à jour le produit'}
          </button>
        </div>
      </form>
    </div>
  );
}
