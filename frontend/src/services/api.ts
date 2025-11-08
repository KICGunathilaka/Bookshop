import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export interface LoginResponse {
  message: string;
  user: { user_id: number; username: string };
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data;
};