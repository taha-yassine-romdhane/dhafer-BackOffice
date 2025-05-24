'use client';

interface StockSummaryProps {
  globalStock: {
    totalStock: number;
    inStockOnline: number;
    outOfStockOnline: number;
  };
}

export default function StockSummary({ globalStock }: StockSummaryProps) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Stock global</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-medium">{globalStock.totalStock}</div>
        </div>
        <div className="bg-green-50 p-2 rounded-lg text-center">
          <div className="text-xs text-green-600">En stock</div>
          <div className="text-lg font-medium">{globalStock.inStockOnline}</div>
        </div>
        <div className="bg-red-50 p-2 rounded-lg text-center">
          <div className="text-xs text-red-600">Rupture</div>
          <div className="text-lg font-medium">{globalStock.outOfStockOnline}</div>
        </div>
      </div>
    </div>
  );
}
