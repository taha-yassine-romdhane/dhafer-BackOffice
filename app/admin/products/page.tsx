'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/lib/types';
import { Search, Filter, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products and categories in parallel
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ]);

      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      // Set products
      if (productsData.success && Array.isArray(productsData.products)) {
        setProducts(productsData.products);
      } else if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        console.error('Unexpected API response format for products:', productsData);
        setProducts([]);
      }

      // Set categories
      if (categoriesData.success && Array.isArray(categoriesData.categories)) {
        setCategories(categoriesData.categories);
      } else {
        console.error('Unexpected API response format for categories:', categoriesData);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (productId: number) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/admin/products/${productToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      fetchData();
      toast.success('Produit supprimé avec succès');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Échec de la suppression du produit');
    }
  };

  // Helper function to get category names for a product
  const getCategoryNames = (product: Product): string => {
    if (!product.categories || product.categories.length === 0) {
      return 'Non catégorisé';
    }

    return product.categories
      .map(pc => pc.category.name)
      .join(', ');
  };

  // Filter products based on search term, selected category, and category group
  const filteredProducts = products.filter(product => {
    // Match search term
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Match selected category
    const matchesCategory =
      selectedCategoryId === 'all' ||
      product.categories.some(pc => pc.categoryId === selectedCategoryId);

    // Match selected category group
    const matchesCategoryGroup =
      selectedCategoryGroup === 'all' ||
      product.categories.some(pc => pc.category.group === selectedCategoryGroup);

    return matchesSearch && matchesCategory && matchesCategoryGroup;
  });

  // Prepare categories for dropdown based on selected group
  const filteredCategories = selectedCategoryGroup === 'all' 
    ? categories 
    : categories.filter(category => category.group === selectedCategoryGroup);
    
  const categoryOptions = [
    { id: 'all', name: 'Toutes les catégories' },
    ...filteredCategories
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="mt-2 text-md text-gray-700">Gérer votre catalogue de produits</p>
          <div className="flex gap-2">
            <p className="text-gray-800 text-s">
              Règles de modification des produits :
              <br />
              1. Si vous modifiez les couleur ou les tailles d'un produit les commandes associées à ce produit ne son pas livrées, ces commandes seront perdues les informations .
              <br />
              2. La meilliere pratique est de travailler est de extraire les Commandes en excel chaque jour.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/admin/products/new')}
          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un nouveau produit
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5 text-gray-500" />
            Filtres
          </h2>
          {(searchTerm || selectedCategoryId !== 'all' || selectedCategoryGroup !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryId('all');
                setSelectedCategoryGroup('all');
              }}
              className="text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="flex justify-center w-5">
                <Search className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
              </div>
            </div>
            <Input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-[#D4AF37] shadow-sm"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-[#D4AF37]" />
              </button>
            )}
          </div>

          {/* Group Filter - Moved to be first */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
            <select
              value={selectedCategoryGroup}
              onChange={(e) => {
                setSelectedCategoryGroup(e.target.value);
                // Reset category selection when group changes
                setSelectedCategoryId('all');
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] py-2 pl-3 pr-10 text-base"
            >
              <option value="all">Tous les groupes</option>
              <option value="FEMME">Femme</option>
              <option value="ENFANT">Enfant</option>
              <option value="ACCESSOIRE">Accessoire</option>
            </select>
          </div>

          {/* Category Filter - Now disabled until group is selected */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={typeof selectedCategoryId === 'number' ? selectedCategoryId.toString() : selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] py-2 pl-3 pr-10 text-base ${selectedCategoryGroup === 'all' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={selectedCategoryGroup === 'all'}
            >
              {categoryOptions.map(category => (
                <option key={category.id.toString()} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategoryId !== 'all' || selectedCategoryGroup !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-500 mr-2 pt-1">Filtres actifs:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Recherche: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategoryId !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Catégorie: {categories.find(c => c.id === selectedCategoryId)?.name}
                <button onClick={() => setSelectedCategoryId('all')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategoryGroup !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Groupe: {selectedCategoryGroup === 'FEMME' ? 'Femme' : selectedCategoryGroup === 'ENFANT' ? 'Enfant' : 'Accessoire'}
                <button onClick={() => setSelectedCategoryGroup('all')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-4 mb-2 text-sm text-gray-500">
        {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="aspect-w-3 aspect-h-2">
              <img
                src={product.colorVariants[0]?.images.find(img => img.isMain)?.url || product.colorVariants[0]?.images[0]?.url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {product.description.length > 100
                  ? `${product.description.substring(0, 100)}...`
                  : product.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {product.categories.map(pc => (
                  <span key={pc.categoryId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {pc.category.name}
                  </span>
                ))}
                {product.categories.length > 0 && product.categories[0].category.group && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-1">
                    {product.categories[0].category.group}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">
                  {product.price.toFixed(2)} TND
                </span>
                {product.salePrice && (
                  <span className="text-sm font-medium text-red-600">
                    {product.salePrice.toFixed(2)} TND
                  </span>
                )}
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier
                </button>
                <button
                  onClick={() => openDeleteDialog(product.id)}
                  className="flex-1 bg-red-50 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Essayez d'adapter votre recherche ou votre filtre pour trouver ce que vous cherchez.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
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
    </div>
  );
}