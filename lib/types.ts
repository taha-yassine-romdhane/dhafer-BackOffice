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

export interface Stock {
  id: number;
  inStock: boolean;
  size: string;
  colorId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  category: string;
  sizes: string[];
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