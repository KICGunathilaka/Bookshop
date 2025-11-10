import axios from 'axios';

const API_URL = 'http://localhost:5001/api/products';

export interface ProductInput {
  product_name: string;
  category?: string | null;
  brand?: string | null;
  unit?: string; // default 'pcs'
  purchase_price?: number; // default 0
  selling_price?: number; // default 0
  stock_quantity?: number; // default 0
}

export interface ProductResponse {
  message: string;
  product: {
    product_id: number;
    product_name: string;
    category: string | null;
    brand: string | null;
    unit: string;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
  };
}

export const addProduct = async (payload: ProductInput): Promise<ProductResponse> => {
  const response = await axios.post(API_URL, payload);
  return response.data;
};

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
}

export interface ProductListResponse {
  items: Array<{
    product_id: number;
    product_name: string;
    category: string | null;
    brand: string | null;
    unit: string;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    created_at: string;
  }>;
}

export const getProducts = async (filters: ProductFilters = {}): Promise<ProductListResponse> => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

export interface UpdateProductInput {
  product_name?: string;
  category?: string | null;
  brand?: string | null;
  unit?: string;
  purchase_price?: number;
  selling_price?: number;
  stock_quantity?: number;
}

export const updateProduct = async (
  product_id: number,
  payload: UpdateProductInput
): Promise<{ message: string; product: any }> => {
  const response = await axios.put(`${API_URL}/${product_id}`, payload);
  return response.data;
};