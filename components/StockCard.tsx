// components/StockCard.tsx
interface StockCardProps {
    stock: {
      id: number;
      size: string;
      quantity: number;
    };
    onUpdate: (stockId: number, quantity: number) => void;
  }
  
  export function StockCard({ stock, onUpdate }: StockCardProps) {
    return (
      <div className="border rounded p-4 flex flex-col gap-2 bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium">Size: {stock.size}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate(stock.id, Math.max(0, stock.quantity - 1))}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{stock.quantity}</span>
            <button
              onClick={() => onUpdate(stock.id, stock.quantity + 1)}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 items-center mt-2">
          <input
            type="number"
            min="0"
            value={stock.quantity}
            onChange={(e) => onUpdate(stock.id, parseInt(e.target.value) || 0)}
            className="border rounded px-2 py-1 w-full"
          />
          <button
            onClick={() => onUpdate(stock.id, parseInt(String(stock.quantity)) || 0)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    );
  }