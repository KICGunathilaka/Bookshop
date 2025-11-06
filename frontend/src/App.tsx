import React, { useState, useEffect } from 'react';

import { Book } from './interfaces/Book';
import BookList from './components/BookList';
import AddBookForm from './components/AddBookForm';
import './App.css';

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const books = await getBooks();
    setBooks(books);
  };

  const handleAddBook = async (book: Book) => {
    await addBook(book);
    fetchBooks();
  };

  const handleUpdateBook = async (id: number, book: Book) => {
    await updateBook(id, book);
    setEditingBook(null);
    fetchBooks();
  };

  const handleDeleteBook = async (id: number) => {
    await deleteBook(id);
    fetchBooks();
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
  };

  return (
    <div className="App">
      <h1>Bookshop Management</h1>
      <AddBookForm onAdd={handleAddBook} onUpdate={handleUpdateBook} editingBook={editingBook} />
      <BookList books={books} onDelete={handleDeleteBook} onEdit={handleEditBook} />
    </div>
  );
};

export default App;
