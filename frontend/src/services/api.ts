import axios from 'axios';

const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/auth`;

export interface LoginResponse {
  message: string;
  user: { user_id: number; username: string };
}

export const login = async (username: string, password?: string): Promise<LoginResponse> => {
  const body: Record<string, unknown> = { username };
  if (password !== undefined && password !== null) {
    body.password = password;
  }
  const response = await axios.post(`${API_URL}/login`, body);
  return response.data;
};