
export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size';

export interface Product {
  id: string;
  name: string;
  price: number;
  // stockBySize tracks quantity for each specific size
  stockBySize: Partial<Record<ProductSize, number>>;
  sizes: ProductSize[];
  image: string; // Base64 string
  description: string;
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: ProductSize;
  price: number; 
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalItemsInStock: number;
  totalOrders: number;
}
