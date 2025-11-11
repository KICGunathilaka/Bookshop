import axios from 'axios';

const API_URL = 'http://localhost:5001/api/products';

export interface ProductInput {
  product_name: string;
  category?: string | null;
  unit?: string; // default 'pcs'
}

export interface ProductResponse {
  message: string;
  product: {
    product_id: number;
    product_name: string;
    category: string | null;
    unit: string;
    created_at: string;
  };
}

export const addProduct = async (payload: ProductInput): Promise<ProductResponse> => {
  const response = await axios.post(API_URL, payload);
  return response.data;
};

export interface ProductFilters {
  q?: string;
  category?: string;
  unit?: string;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
}

export interface ProductListResponse {
  items: Array<{
    product_id: number;
    product_name: string;
    category: string | null;
    unit: string;
    created_at: string;
  }>;
}

export const getProducts = async (filters: ProductFilters = {}): Promise<ProductListResponse> => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

export const searchProducts = async (q: string) => {
  const res = await getProducts({ q });
  return res.items;
};