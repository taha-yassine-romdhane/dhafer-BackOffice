'use client';

import { OrderStatus } from '@prisma/client';

interface OrderStatusData {
  status: OrderStatus;
  count: number;
  revenue: number;
}

interface OrderStatusSummaryProps {
  ordersByStatus: OrderStatusData[];
  statusTranslations: Record<OrderStatus, string>;
}

export default function OrderStatusSummary({ ordersByStatus, statusTranslations }: OrderStatusSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Résumé des statuts des commandes
      </h3>
      <div className="space-y-4">
        {ordersByStatus.map((statusData) => (
          <div
            key={statusData.status}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    statusData.status === 'PENDING'
                      ? 'rgb(251, 191, 36)'
                      : statusData.status === 'CONFIRMED'
                      ? 'rgb(79, 70, 229)'
                      : statusData.status === 'SHIPPED'
                      ? 'rgb(59, 130, 246)'
                      : statusData.status === 'DELIVERED'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(239, 68, 68)',
                }}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {statusTranslations[statusData.status]}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">
                {statusData.count} commandes
              </span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500">Montant: </span>
              <span className="font-medium text-gray-900">
                {statusData.revenue.toFixed(2)} TND
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
