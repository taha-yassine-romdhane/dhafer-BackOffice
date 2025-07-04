// app/admin/stock/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Define local interfaces for the stock management page
interface StockItem {
  id: number;
  inStockOnline: boolean;
  size: string;
  sizeId: number;
  colorId: number;
  updatedAt: Date;
}

interface ColorVariantWithStocks {
  id: number;
  color: string;
  images: {
    id: number;
    url: string;
    isMain: boolean;
    ufsUrl?: string;
  }[];
  stocks: StockItem[];
}

interface ProductWithStocks {
  id: number;
  name: string;
  colorVariants: ColorVariantWithStocks[];
}

export default function StockManagementPage() {
  const [products, setProducts] = useState<ProductWithStocks[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string | null;
  }>({ type: null, text: null });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      // Reset pagination to first page when fetching new data
      setCurrentPage(1);
      const response = await fetch('/api/admin/stock', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stocks');
      }
  
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        console.log('Stock data refreshed successfully');
        return true;
      } else {
        throw new Error(data.error || 'Failed to fetch stocks');
      }
    } catch (err: any) {
      console.error('Stock fetch error:', err);
      showMessage('error', err.message || 'Error fetching stocks');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: null }), 3000);
  }, []);

  // Calculate stock summary for a product
  const calculateStockSummary = useCallback((product: ProductWithStocks) => {
    let inStockCount = 0;
    let outOfStockCount = 0;
    let totalLocations = 0;

    product.colorVariants.forEach(variant => {
      variant.stocks.forEach(stock => {
        // Only count online stock status
        totalLocations += 1; // Only 1 location (online) per stock item
        
        // Count available locations
        if (stock.inStockOnline) inStockCount++;
        else outOfStockCount++;
      });
    });

    return { inStockCount, outOfStockCount, totalLocations };
  }, []);

  // Calculate filtered products and pagination data
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  }, [filteredProducts, itemsPerPage]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
        
        {/* Search and Navigation */}
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <select 
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <option value="5">5 par page</option>
            <option value="10">10 par page</option>
            <option value="20">20 par page</option>
            <option value="50">50 par page</option>
          </select>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  En Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hors Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière Mise à Jour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit disponible'}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => {
                  const stockSummary = calculateStockSummary(product);
                  
                  // Find the most recent update date
                  let lastUpdated: Date | null = null;
                  product.colorVariants.forEach(variant => {
                    variant.stocks.forEach(stock => {
                      if (!lastUpdated || new Date(stock.updatedAt) > new Date(lastUpdated)) {
                        lastUpdated = stock.updatedAt;
                      }
                    });
                  });
                  
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.colorVariants[0]?.images && product.colorVariants[0].images.length > 0 ? (
                            <img
                              src={product.colorVariants[0].images[0].url}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/150?text=No+Image";
                                // Prevent infinite error loops
                                target.onerror = null;
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                              <span className="text-xs">No Image</span>
                            </div>
                          )
                          }
                          <div>
                            <div className="font-medium text-gray-900 px-4">{product.name}</div>
                            <div className="text-sm text-gray-500 px-4">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {stockSummary.inStockCount} Produits en stock
                        </span>
                        <div className="text-xs text-gray-500">
                          ({Math.round((stockSummary.inStockCount / stockSummary.totalLocations) * 100)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {stockSummary.outOfStockCount} Produits hors stock
                        </span>
                        <div className="text-xs text-gray-500">
                          ({Math.round((stockSummary.outOfStockCount / stockSummary.totalLocations) * 100)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lastUpdated ? format(new Date(lastUpdated), 'MMM d, HH:mm') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          href={`/admin/stock/${product.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Gestion Stock →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> à <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> sur <span className="font-medium">{filteredProducts.length}</span> produits
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Précédent
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                variant="outline"
                size="sm"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}