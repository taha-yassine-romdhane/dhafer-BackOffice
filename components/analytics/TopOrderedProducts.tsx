'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

interface TopProduct {
  id: number;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  imageUrl?: string;
  color?: string;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

interface TopOrderedProductsProps {
  products: TopProduct[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TopOrderedProducts({ products }: TopOrderedProductsProps) {
  const [displayMode, setDisplayMode] = useState<'table' | 'chart'>('table');
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');

  // Sort products based on the selected criteria and limit to top 5
  const sortedProducts = [...products]
    .sort((a, b) => 
      sortBy === 'quantity' 
        ? b.totalQuantity - a.totalQuantity 
        : b.totalRevenue - a.totalRevenue
    )
    .slice(0, 5); // Only show top 5 products

  // Prepare data for the chart
  const chartData = sortedProducts.map((product, index) => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    [sortBy === 'quantity' ? 'Quantité' : 'Revenu (TND)']: 
      sortBy === 'quantity' ? product.totalQuantity : product.totalRevenue,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Produits les plus commandés
        </h3>
        
        <div className="flex space-x-4">
          {/* Display mode toggle */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1 rounded-full text-sm ${displayMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Tableau
            </button>
            <button
              onClick={() => setDisplayMode('chart')}
              className={`px-3 py-1 rounded-full text-sm ${displayMode === 'chart' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Graphique
            </button>
          </div>
          
          {/* Sort criteria toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSortBy('quantity')}
              className={`px-3 py-1 rounded-full text-sm ${sortBy === 'quantity' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Par jour
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-3 py-1 rounded-full text-sm ${sortBy === 'revenue' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Par revenu
            </button>
          </div>
        </div>
      </div>

      {displayMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité vendue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenu total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut des commandes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl ? (
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            onError={(e) => {
                              // Replace with placeholder on error
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = 'https://via.placeholder.com/40?text=N/A';
                            }}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No img</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.color && (
                          <div className="text-xs text-gray-500">
                            Couleur: {product.color}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{product.totalQuantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{product.totalRevenue.toFixed(2)} TND</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                        <span className="text-xs text-gray-500">En attente: {product.pendingOrders}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-gray-500">Livrées: {product.completedOrders}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-xs text-gray-500">Annulées: {product.cancelledOrders}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [
                  sortBy === 'quantity' 
                    ? `${value} unités` 
                    : `${Number(value).toFixed(2)} TND`,
                  sortBy === 'quantity' ? 'Quantité' : 'Revenu'
                ]}
              />
              <Legend />
              <Bar 
                dataKey={sortBy === 'quantity' ? 'Quantité' : 'Revenu (TND)'} 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
