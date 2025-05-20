'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Plus } from 'lucide-react';
import Dropzone from '@/components/drop-zone';
import { Stock, ProductImage, Category, Size, ProductCategory, ProductSize } from '@/lib/types';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  categoryIds: number[];
  sizeIds: number[];
  collaborateur: string | null;
  colorVariants: ColorVariantImages[];
}

export default function EditProductPage({ params }: { params: { productId: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newSize, setNewSize] = useState<string>('');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('FEMME');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isAddingSize, setIsAddingSize] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    salePrice: null,
    categoryIds: [],
    sizeIds: [],
    collaborateur: null,
    colorVariants: [],
  });

  // Fetch categories and sizes
  useEffect(() => {
    const fetchCategoriesAndSizes = async () => {
      try {
        const [categoriesResponse, sizesResponse] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/sizes')
        ]);

        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        if (!sizesResponse.ok) throw new Error('Failed to fetch sizes');

        const categoriesData = await categoriesResponse.json();
        const sizesData = await sizesResponse.json();

        setCategories(categoriesData.categories || []);
        setSizes(sizesData.sizes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load categories and sizes');
      }
    };

    fetchCategoriesAndSizes();
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');

        const { product } = await response.json();

        if (!product) {
          throw new Error('Product not found');
        }

        // Extract category and size IDs from the product
        const categoryIds = product.categories?.map((pc: ProductCategory) => pc.categoryId) || [];
        const sizeIds = product.sizes?.map((ps: ProductSize) => ps.sizeId) || [];

        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price ? product.price.toString() : '',
          salePrice: product.salePrice ? product.salePrice.toString() : null,
          categoryIds: categoryIds,
          sizeIds: sizeIds,
          collaborateur: product.collaborateur || null,
          colorVariants: product.colorVariants?.map((cv: any) => ({
            id: cv.id || crypto.randomUUID(),
            color: cv.color || '',
            colorVariantId: cv.id || crypto.randomUUID(),
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

  // Handle adding a new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    setIsAddingCategory(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory,
          group: selectedCategoryGroup
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const data = await response.json();
      const newCategoryObj = data.category;

      setCategories(prev => [...prev, newCategoryObj]);
      setFormData(prev => ({
        ...prev,
        categoryIds: [...prev.categoryIds, newCategoryObj.id]
      }));
      setNewCategory('');
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle adding a new size
  const handleAddSize = async () => {
    if (!newSize.trim()) {
      setError('Le nom de la taille est requis');
      return;
    }

    setIsAddingSize(true);
    try {
      const response = await fetch('/api/admin/sizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newSize }),
      });

      if (!response.ok) {
        throw new Error('Failed to create size');
      }

      const data = await response.json();
      const newSizeObj = data.size;

      setSizes(prev => [...prev, newSizeObj]);
      setFormData(prev => ({
        ...prev,
        sizeIds: [...prev.sizeIds, newSizeObj.id]
      }));
      setNewSize('');
    } catch (error) {
      console.error('Error creating size:', error);
      setError('Failed to create size');
    } finally {
      setIsAddingSize(false);
    }
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
        id: crypto.randomUUID(),
        colorVariantId: crypto.randomUUID()
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.name.trim()) throw new Error('Product name is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.price) throw new Error('Price is required');
      if (formData.categoryIds.length === 0) throw new Error('At least one category is required');
      if (formData.sizeIds.length === 0) throw new Error('At least one size is required');
      if (formData.colorVariants.length === 0) throw new Error('At least one color variant is required');

      // Process each color variant
      const colorVariantsWithUrls = await Promise.all(
        formData.colorVariants.map(async (colorVariant) => {
          // Get existing images that should be kept
          const existingImages = colorVariant.existingImages || [];
          
          // Upload new images if any
          let newUploadedImages = [];
          if (colorVariant.images.length > 0) {
            const imageFormData = new FormData();
            colorVariant.images.forEach((image: File, index) => {
              imageFormData.append('images', image);
              imageFormData.append('positions', index === 0 ? 'front' : index === 1 ? 'back' : 'side');
            });

            const uploadResponse = await fetch('/api/admin/upload', {
              method: 'POST',
              body: imageFormData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload images for ${colorVariant.color}`);
            }

            const { images: uploadedImages } = await uploadResponse.json();
            newUploadedImages = uploadedImages;
          }

          // Return the color variant with image information
          return {
            id: colorVariant.colorVariantId,
            color: colorVariant.color,
            // Include information about which existing images to keep and which new ones to create
            images: {
              // Send IDs of existing images that should be kept
              existingIds: existingImages.map((img: any) => img.id),
              // Send new images to be created
              create: newUploadedImages.map((img: any) => ({
                url: img.url,
                isMain: img.isMain || false,
                position: img.position
              }))
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
        categoryIds: formData.categoryIds,
        sizeIds: formData.sizeIds,
        collaborateur: formData.collaborateur,
        colorVariants: colorVariantsWithUrls
      };

      const response = await fetch(`/api/admin/products/${params.productId}`, {
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
              <Input
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
                Groupe de catégories
              </label>
              <select
                value={selectedCategoryGroup}
                onChange={(e) => setSelectedCategoryGroup(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="FEMME">Femme</option>
                <option value="ENFANT">Enfant</option>
                <option value="ACCESSOIRE">Accessoire</option>
              </select>
            </div>

            {/* Categories */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégories
              </label>
              
              {/* Group categories by their group */}
              {['FEMME', 'ENFANT', 'ACCESSOIRE'].map((group) => {
                const groupCategories = categories.filter(cat => cat.group === group);
                if (groupCategories.length === 0) return null;
                
                return (
                  <div key={group} className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{group === 'FEMME' ? 'Femme' : group === 'ENFANT' ? 'Enfant' : 'Accessoire'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {groupCategories.map((category) => (
                        <label key={category.id} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              const updatedCategories = e.target.checked
                                ? [...formData.categoryIds, category.id]
                                : formData.categoryIds.filter(id => id !== category.id);
                              setFormData(prev => ({ ...prev, categoryIds: updatedCategories }));
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="flex items-center mt-4">
                <Input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nouvelle catégorie"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 flex-grow"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isAddingCategory}
                  className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isAddingCategory ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
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
                <Input
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
                <Input
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
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Sizes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tailles *
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <label key={size.id} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <input
                      type="checkbox"
                      checked={formData.sizeIds.includes(size.id)}
                      onChange={(e) => {
                        const updatedSizes = e.target.checked
                          ? [...formData.sizeIds, size.id]
                          : formData.sizeIds.filter(id => id !== size.id);
                        setFormData(prev => ({ ...prev, sizeIds: updatedSizes }));
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{size.value}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center mt-2">
                <Input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Nouvelle taille"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 flex-grow"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  disabled={isAddingSize}
                  className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isAddingSize ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variants de couleur Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Variants de couleur</h2>
            <div className="flex gap-2 items-center">
              <Input
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

              {/* Display existing images if any */}
              {colorVariant.existingImages && colorVariant.existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Images existantes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {colorVariant.existingImages.map((image, imageIndex) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                          <Image
                            src={image.url}
                            alt={`Product ${imageIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Dropzone
                color={colorVariant.color}
                onImagesChange={(files, previewUrls) => {
                  setFormData(prev => {
                    const updatedColorVariants = [...prev.colorVariants];
                    updatedColorVariants[colorIndex] = {
                      ...updatedColorVariants[colorIndex],
                      images: files,
                      previewUrls: previewUrls
                    };
                    return { ...prev, colorVariants: updatedColorVariants };
                  });
                }}
              />
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
