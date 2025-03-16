// components/ProductStockDetail.tsx
'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';

const LOCATIONS = ["monastir", "tunis", "sfax", "online"] as const;
type Location = typeof LOCATIONS[number];

interface Stock {
  id: number;
  quantity: number;
  size: string;
  location: Location;
  colorId: number;
  updatedAt: Date;
}

interface ProductImage {
  url: string;
  alt?: string;
  isMain: boolean;
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
  const [selectedLocation, setSelectedLocation] = useState<Location>("online");
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
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

  // Update stock quantity
  const updateStock = async (stockId: number, quantity: number) => {
    setLoading(prev => ({ ...prev, [stockId]: true }));
    setError(null);

    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      showMessage(`Stock updated successfully at ${format(new Date(), 'HH:mm:ss')}`, false);
      onUpdate(); // Refresh parent data
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error updating stock', true);
    } finally {
      setLoading(prev => ({ ...prev, [stockId]: false }));
    }
  };

  // Calculate total stock for a variant
  const calculateVariantStock = (stocks: Stock[]) => {
    return stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </button>
          <h3 className="text-xl font-bold">{product.name}</h3>
          <p className="text-sm text-gray-500">Product ID: {product.id}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Location:</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as Location)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {LOCATIONS.map(location => (
                <option key={location} value={location}>
                  {location.charAt(0).toUpperCase() + location.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
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
        {product.colorVariants.map((variant) => {
          const totalStock = calculateVariantStock(
            variant.stocks.filter(stock => stock.location === selectedLocation)
          );
          
          return (
            <div key={variant.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  {variant.images?.[0] && (
                    <img
                      src={variant.images[0].url}
                      alt={variant.color}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{variant.color}</h4>
                    <p className="text-sm text-gray-500">
                      {totalStock} units in {selectedLocation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Size
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Stock
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variant.stocks
                      .filter(stock => stock.location === selectedLocation)
                      .sort((a, b) => a.size.localeCompare(b.size))
                      .map((stock) => (
                        <tr key={stock.id}>
                          <td className="py-2 px-2">
                            <span className="font-medium">{stock.size}</span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateStock(stock.id, Math.max(0, stock.quantity - 1))}
                                disabled={loading[stock.id]}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={stock.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value >= 0) {
                                    updateStock(stock.id, value);
                                  }
                                }}
                                disabled={loading[stock.id]}
                                className={`w-16 text-center rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                  loading[stock.id] ? 'opacity-50' : ''
                                }`}
                              />
                              <button
                                onClick={() => updateStock(stock.id, stock.quantity + 1)}
                                disabled={loading[stock.id]}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                              >
                                +
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