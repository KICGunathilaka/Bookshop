import axios from 'axios';

const API_URL = 'http://localhost:5001/api/vendors';

export interface VendorInput {
  vendor_name: string;
  contact_number?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface VendorResponse {
  message: string;
  vendor: {
    vendor_id: number;
    vendor_name: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
  };
}

export const addVendor = async (payload: VendorInput): Promise<VendorResponse> => {
  const response = await axios.post(API_URL, payload);
  return response.data;
};

export interface VendorFilters {
  q?: string;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
}

export interface VendorListResponse {
  items: Array<{
    vendor_id: number;
    vendor_name: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
  }>;
}

export const getVendors = async (filters: VendorFilters = {}): Promise<VendorListResponse> => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};