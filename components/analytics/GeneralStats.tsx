'use client';

interface GeneralStatsProps {
  totalProducts: number;
  totalOrders: number;
}

export default function GeneralStats({ totalProducts, totalOrders }: GeneralStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total des produits</h3>
        <p className="text-3xl font-bold text-indigo-600">
          {totalProducts}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total des commandes</h3>
        <p className="text-3xl font-bold text-indigo-600">
          {totalOrders}
        </p>
      </div>
    </div>
  );
}
