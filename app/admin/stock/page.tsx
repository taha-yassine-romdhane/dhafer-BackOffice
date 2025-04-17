// app/admin/stock/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { ProductStockDetail } from '@/components/ProductStockDetail';
import { format } from 'date-fns';

// Define local interfaces for the stock management page
interface StockItem {
  id: number;
  inStockJammel: boolean;
  inStockTunis: boolean;
  inStockSousse: boolean;
  inStockOnline: boolean;
  size: string;
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
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStocks | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string | null;
  }>({ type: null, text: null });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stock');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stocks');
      }
  
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      } else {
        throw new Error(data.error || 'Failed to fetch stocks');
      }
    } catch (err: any) {
      console.error('Stock fetch error:', err);
      showMessage('error', err.message || 'Error fetching stocks');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: null }), 3000);
  };

  // Calculate stock summary for a product
  const calculateStockSummary = (product: ProductWithStocks) => {
    let inStockCount = 0;
    let outOfStockCount = 0;
    let totalLocations = 0;

    product.colorVariants.forEach(variant => {
      variant.stocks.forEach(stock => {
        // Count each location separately
        totalLocations += 4; // 4 locations per stock item
        
        // Count available locations
        if (stock.inStockJammel) inStockCount++;
        else outOfStockCount++;
        
        if (stock.inStockTunis) inStockCount++;
        else outOfStockCount++;
        
        if (stock.inStockSousse) inStockCount++;
        else outOfStockCount++;
        
        if (stock.inStockOnline) inStockCount++;
        else outOfStockCount++;
      });
    });

    return { inStockCount, outOfStockCount, totalLocations };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
        
        {/* Search and Navigation */}
        <div className="flex items-center gap-4">
          {!selectedProduct && (
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          )}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : selectedProduct ? (
        <ProductStockDetail
          product={selectedProduct as any}
          onUpdate={fetchStocks}
          onBack={() => setSelectedProduct(null)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Out of Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products
                  .filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(product => {
                    const stockSummary = calculateStockSummary(product);
                    const lastUpdated = product.colorVariants
                      .flatMap(v => v.stocks)
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt;

                    return (
                      <tr 
                        key={product.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.colorVariants[0]?.images?.[0] && (
                              <img
                                src={product.colorVariants[0].images[0].url}
                                alt={product.name}
                                className="w-10 h-10 rounded-full mr-3 object-cover"
                                onError={(e) => {
                                  // If the image fails to load, try the ufsUrl property if available
                                  const target = e.target as HTMLImageElement;
                                  const image = product.colorVariants[0].images[0];
                                  
                                  // Try to use the ufsUrl from UploadThing if the regular URL fails
                                  if (image.url.includes('uploadthing')) {
                                    // Already using UploadThing URL, use a placeholder
                                    target.src = "https://via.placeholder.com/150?text=No+Image";
                                  } else {
                                    // Try to transform the URL to a Cloudinary URL with proper sizing
                                    const cloudinaryUrl = image.url.replace('upload/', 'upload/w_150,h_150,c_fit/');
                                    target.src = cloudinaryUrl;
                                  }
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">ID: {product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {stockSummary.inStockCount} locations
                          </span>
                          <div className="text-xs text-gray-500">
                            ({Math.round((stockSummary.inStockCount / stockSummary.totalLocations) * 100)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {stockSummary.outOfStockCount} locations
                          </span>
                          <div className="text-xs text-gray-500">
                            ({Math.round((stockSummary.outOfStockCount / stockSummary.totalLocations) * 100)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lastUpdated ? format(new Date(lastUpdated), 'MMM d, HH:mm') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Manage Stock →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}