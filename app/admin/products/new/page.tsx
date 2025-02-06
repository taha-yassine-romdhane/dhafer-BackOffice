'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Plus } from 'lucide-react';
import Dropzone from '@/components/drop-zone';
import { Stock, ProductImage } from '@/lib/types';
import { SIZE_GROUPS } from '@/lib/constants';

const CATEGORY_GROUPS = [
  {
    label: "Femme",
    categories: ["abaya", "caftan", "robe-soire", "jebba"]
  },
  {
    label: "Enfants",
    categories: ["enfants-caftan", "enfants-robe-soire", "tabdila"]
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
  images: File[];
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

      // Upload images for each color variant
      const colorVariantsWithUrls = await Promise.all(
        formData.colorVariants.map(async (colorVariant) => {
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

          const { images: uploadedImages }: { images: { url: string; alt?: string; isMain: boolean; position: string; }[] } = await uploadResponse.json();

          return {
            color: colorVariant.color,
            images: uploadedImages.map((image): ProductImage => ({
              id: Number(Date.now()), // Using timestamp as a unique number
              url: image.url,
              alt: image.alt || '',
              isMain: image.isMain,
              position: image.position,
              colorVariantId: colorVariant.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            stocks: colorVariant.stocks
          };
        })
      );

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
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
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
    </div>
  );
}
