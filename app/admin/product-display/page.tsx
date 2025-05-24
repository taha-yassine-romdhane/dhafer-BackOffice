// app/admin/product-display/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


type PendingChanges = {
  [key: number]: {
    showInHome?: boolean;
    showInTopSales?: boolean;
    priority?: number;
  };
};

export default function ProductDisplayManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [homePageProducts, setHomePageProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [saving, setSaving] = useState(false);
  const [showOnlyHomeProducts, setShowOnlyHomeProducts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.products)) {
        const allProducts = data.products;
        setProducts(allProducts);
        // Filter products that are shown on the home page
        setHomePageProducts(allProducts.filter((product: Product) => product.showInHome));
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    productId: number,
    updates: {
      showInHome?: boolean;
      showInTopSales?: boolean;
      priority?: number;
    }
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        ...updates
      }
    }));
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(pendingChanges);
      if (updates.length === 0) {
        return;
      }

      // Save all changes in parallel
      await Promise.all(
        updates.map(([productId, changes]) =>
          fetch(`/api/admin/products/${productId}/display`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changes),
          })
        )
      );

      // Refresh products list
      await fetchProducts();
      setPendingChanges({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Get the current value for a product (either pending change or original value)
  const getCurrentValue = (product: Product, key: keyof Product) => {
    const pending = pendingChanges[product.id];
    return pending && key in pending
      ? pending[key as keyof typeof pending]
      : product[key];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des produits de la page d'accueil</h1>
            
            {Object.keys(pendingChanges).length > 0 && (
              <button
                onClick={saveAllChanges}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            )}
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <label htmlFor="showHomeOnly" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="showHomeOnly" 
                    className="sr-only" 
                    checked={showOnlyHomeProducts}
                    onChange={() => setShowOnlyHomeProducts(!showOnlyHomeProducts)}
                  />
                  <div className={`block w-14 h-8 rounded-full ${showOnlyHomeProducts ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${showOnlyHomeProducts ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  {showOnlyHomeProducts ? 'Afficher uniquement les produits de la page d\'accueil' : 'Afficher tous les produits'}
                </div>
              </label>
            </div>
          </div>
        </header>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showOnlyHomeProducts ? homePageProducts : products).map((product) => {
            const mainImage = product.colorVariants[0]?.images.find(img => img.isMain)?.url || 
                            product.colorVariants[0]?.images[0]?.url;
            const displayKey = 'showInHome' as keyof Product;
            const isShowing = getCurrentValue(product, displayKey) as boolean;
            const currentPriority = getCurrentValue(product, 'priority') as number;
            const hasChanges = pendingChanges[product.id];
  
            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm ${
                  hasChanges ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  {mainImage && (
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-4">{product.name}</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isShowing ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                    }`}>
                      {isShowing ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => handleChange(product.id, { [displayKey]: !isShowing })}
                      className={`px-4 py-1 rounded-full text-sm font-medium ${
                        isShowing
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isShowing ? 'Supprimer' : 'Ajouter'}
                    </button>
                  </div>
  
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-600">Priorité</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleChange(product.id, { 
                          priority: Math.max(0, (currentPriority || 0) - 1) 
                        })}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={currentPriority || 0}
                        onChange={(e) => handleChange(product.id, {
                          priority: parseInt(e.target.value) || 0
                        })}
                        className="w-16 text-center border rounded-md px-2 py-1"
                      />
                      <button
                        onClick={() => handleChange(product.id, { 
                          priority: (currentPriority || 0) + 1 
                        })}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
