import axios from 'axios';
export interface Book {
  id?: number;
  title: string;
  author: string;
  description: string;
  published_year: number;
  publisher: string;
}

const API_URL = 'http://localhost:5000/api/books';

export const getBooks = async (): Promise<Book[]> => {
  const response = await axios.get(API_URL);
  return response.data.data;
};

export const addBook = async (book: Book): Promise<Book> => {
  const response = await axios.post(API_URL, book);
  return response.data.data;
};

export const updateBook = async (id: number, book: Book): Promise<Book> => {
  const response = await axios.put(`${API_URL}/${id}`, book);
  return response.data.data;
};

export const deleteBook = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};