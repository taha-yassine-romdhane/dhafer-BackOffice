export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  isMain: boolean;
  position: string;
  colorVariantId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColorVariant {
  id: number;
  color: string;
  images: ProductImage[];
  productId: number;
  stocks: Stock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Size {
  id: number;
  value: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  group?: 'FEMME' | 'ENFANT' | 'ACCESSOIRE';
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: number;
  // Location-specific stock status
  inStockJammel: boolean;
  inStockTunis: boolean;
  inStockSousse: boolean;
  inStockOnline: boolean;
  sizeId: number;
  size: Size;
  colorId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  productId: number;
  categoryId: number;
  category: Category;
  createdAt: Date;
}

export interface ProductSize {
  productId: number;
  sizeId: number;
  size: Size;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  // Updated to use relations instead of primitive types
  categories: ProductCategory[];
  sizes: ProductSize[];
  collaborateur: string | null;
  colorVariants: ColorVariant[];
  stocks: Stock[];
  showInHome: boolean;
  showInPromo: boolean;
  showInTopSales: boolean;
  priority: number;
  viewCount: number; 
  orderCount: number; 
  createdAt: Date;
  updatedAt: Date;
}
export type ProductDisplayUpdate = {
  showInHome?: boolean;
  showInPromo?: boolean;
  showInTopSales?: boolean;
  priority?: number;
}