import axios from 'axios';
import { Book } from '../interfaces/Book';

const API_URL = 'http://localhost:5000/api/books';

export const getBooks = async () => {
  const response = await axios.get(API_URL);
  return response.data.data;
};

export const addBook = async (book: Book) => {
  const response = await axios.post(API_URL, book);
  return response.data.data;
};

export const updateBook = async (id: number, book: Book) => {
  const response = await axios.put(`${API_URL}/${id}`, book);
  return response.data.data;
};

export const deleteBook = async (id: number) => {
  await axios.delete(`${API_URL}/${id}`);
};