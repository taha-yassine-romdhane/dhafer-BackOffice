'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductStockDetail } from '@/components/ProductStockDetail';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Define interfaces for the product stock detail page
interface Size {
  id: number;
  value: string;
  description?: string;
}

interface Stock {
  id: number;
  inStockOnline: boolean;
  size: Size;
  sizeId: number;
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

export default function ProductStockDetailPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const productId = parseInt(params.productId);

  useEffect(() => {
    if (isNaN(productId)) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stock/${productId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product details');
      }
  
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match the Product interface
        const transformedProduct = {
          id: data.product.id,
          name: data.product.name,
          colorVariants: data.product.colorVariants.map((variant: any) => ({
            id: variant.id,
            color: variant.color,
            images: variant.images.map((img: any) => ({
              url: img.url,
              alt: '',
              isMain: img.isMain,
              ufsUrl: img.ufsUrl
            })),
            stocks: variant.stocks.map((stock: any) => {
              // Ensure size is properly formatted as a Size object
              let sizeObj: Size;
              if (typeof stock.size === 'string') {
                sizeObj = {
                  id: 0,
                  value: stock.size
                };
              } else if (typeof stock.size === 'object' && stock.size !== null) {
                sizeObj = {
                  id: stock.size.id || 0,
                  value: stock.size.value || 'Unknown'
                };
              } else {
                sizeObj = {
                  id: 0,
                  value: 'Unknown'
                };
              }
              
              return {
                id: stock.id,
                inStockOnline: stock.inStockOnline,
                size: sizeObj,
                sizeId: stock.sizeId || 0,
                colorId: stock.colorId,
                updatedAt: new Date(stock.updatedAt)
              };
            })
          }))
        };
        
        setProduct(transformedProduct);
      } else {
        throw new Error(data.error || 'Failed to fetch product details');
      }
    } catch (err: any) {
      console.error('Product fetch error:', err);
      setError(err.message || 'Error fetching product details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      // Refresh the product data
      await fetchProductDetails();
      return true;
    } catch (error) {
      console.error("Error updating data:", error);
      return false;
    }
  };

  // Instead of delegating navigation to the component, handle it at the page level
  const handleSaveComplete = () => {
    console.log("Save complete, navigating to stock page");
    // Use the router for navigation
    router.push('/admin/stock');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Error: {error}</p>
        <button 
          onClick={() => router.push('/admin/stock')}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Stock Management
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        <p>Product not found</p>
        <button 
          onClick={() => router.push('/admin/stock')}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Stock Management
        </button>
      </div>
    );
  }

  return (
    <ProductStockDetail
      product={product}
      onUpdate={handleUpdate}
      onBack={() => router.push('/admin/stock')}
      onSaveComplete={handleSaveComplete}
    />
  );
}
