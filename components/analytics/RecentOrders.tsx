'use client';

import { OrderStatus } from '@prisma/client';

// Map OrderStatus to French translations and badge colors
const statusTranslations: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  [OrderStatus.CONFIRMED]: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  [OrderStatus.SHIPPED]: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
  [OrderStatus.DELIVERED]: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  [OrderStatus.CANCELLED]: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
};

interface RecentOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface RecentOrdersProps {
  recentOrders: RecentOrder[];
}

export default function RecentOrders({ recentOrders }: RecentOrdersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Commandes récentes
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 text-sm text-gray-900">#{order.id}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {order.customerName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {order.totalAmount.toFixed(2)} TND
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${statusTranslations[order.status].color}`}
                  >
                    {statusTranslations[order.status].label}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
