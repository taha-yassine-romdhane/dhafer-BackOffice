// components/ProductStockDetail.tsx
'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';

interface Stock {
  id: number;
  inStock: boolean;
  size: string;
  colorId: number;
  updatedAt: Date;
}

interface ProductImage {
  url: string;
  alt?: string;
  isMain: boolean;
  ufsUrl?: string;
}

interface ColorVariant {
  id: number;
  color: string;
  images: ProductImage[];
  stocks: Stock[];
}

interface Product {
  id: number;
  name: string;
  colorVariants: ColorVariant[];
}

interface ProductStockDetailProps {
  product: Product;
  onUpdate: () => void;
  onBack: () => void;
}

export function ProductStockDetail({ product, onUpdate, onBack }: ProductStockDetailProps) {
  // Create a local copy of the product data to track changes
  const [localProduct, setLocalProduct] = useState<Product>(JSON.parse(JSON.stringify(product)));
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Show message helper
  const showMessage = useCallback((message: string, isError: boolean) => {
    if (isError) {
      setError(message);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(message);
      setError(null);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      if (isError) setError(null);
      else setSuccessMessage(null);
    }, 3000);
  }, []);

  // Toggle stock status locally
  const toggleStockStatus = (stockId: number) => {
    const newProduct = JSON.parse(JSON.stringify(localProduct)) as Product;
    
    // Find and update the stock
    for (const variant of newProduct.colorVariants) {
      const stockIndex = variant.stocks.findIndex(s => s.id === stockId);
      if (stockIndex !== -1) {
        variant.stocks[stockIndex].inStock = !variant.stocks[stockIndex].inStock;
        setLocalProduct(newProduct);
        setHasChanges(true);
        break;
      }
    }
  };

  // Save all changes
  const saveChanges = async () => {
    if (!hasChanges) return;

    setLoading(true);
    setError(null);

    try {
      // Collect all stocks that have changed
      const changedStocks: { stockId: number; inStock: boolean }[] = [];
      
      localProduct.colorVariants.forEach((localVariant, variantIndex) => {
        localVariant.stocks.forEach((localStock, stockIndex) => {
          const originalStock = product.colorVariants[variantIndex]?.stocks[stockIndex];
          if (originalStock && originalStock.inStock !== localStock.inStock) {
            changedStocks.push({
              stockId: localStock.id,
              inStock: localStock.inStock
            });
          }
        });
      });

      // Send batch update request
      const response = await fetch('/api/admin/stock/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stocks: changedStocks }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stocks');
      }

      showMessage(`Stocks updated successfully at ${format(new Date(), 'HH:mm:ss')}`, false);
      setHasChanges(false);
      onUpdate(); // Refresh parent data
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error updating stocks', true);
    } finally {
      setLoading(false);
    }
  };

  // Discard changes
  const discardChanges = () => {
    setLocalProduct(JSON.parse(JSON.stringify(product)));
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{localProduct.name}</h2>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <>
              <button
                onClick={discardChanges}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Discard Changes
              </button>
              <button
                onClick={saveChanges}
                disabled={loading}
                className={`inline-flex items-center px-4 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Color Variants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {localProduct.colorVariants.map((variant) => {
          return (
            <div key={variant.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center">
                  {variant.images?.[0] && (
                    <img
                      src={variant.images[0].url.replace('upload/', 'upload/w_150,h_150,c_fit/')}
                      alt={variant.color}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Try to use a Cloudinary URL with proper sizing
                        if (target.src.includes('cloudinary')) {
                          target.src = "https://via.placeholder.com/150?text=No+Image";
                        } else {
                          // Try to transform the URL to a Cloudinary URL
                          const cloudinaryUrl = variant.images[0].url.replace('upload/', 'upload/w_150,h_150,c_fit/');
                          target.src = cloudinaryUrl;
                        }
                      }}
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{variant.color}</h4>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Size
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variant.stocks
                      .sort((a, b) => a.size.localeCompare(b.size))
                      .map((stock) => (
                        <tr key={stock.id}>
                          <td className="py-2 px-2">
                            <span className="font-medium">{stock.size}</span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStockStatus(stock.id)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  stock.inStock
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {stock.inStock ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-sm text-gray-500">
                              {format(new Date(stock.updatedAt), 'MMM d, HH:mm')}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}