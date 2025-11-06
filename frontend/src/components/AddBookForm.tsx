import React, { useState, useEffect } from 'react';
import { Book } from '../interfaces/Book';

interface AddBookFormProps {
  onAdd: (book: Book) => void;
  onUpdate: (id: number, book: Book) => void;
  editingBook: Book | null;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ onAdd, onUpdate, editingBook }) => {
  const [book, setBook] = useState<Book>({ title: '', author: '', description: '', published_year: 2024, publisher: '' });

  useEffect(() => {
    if (editingBook) {
      setBook(editingBook);
    }
  }, [editingBook]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBook({ ...book, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      onUpdate(editingBook.id!, book);
    } else {
      onAdd(book);
    }
    setBook({ title: '', author: '', description: '', published_year: 2024, publisher: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{editingBook ? 'Edit Book' : 'Add Book'}</h2>
      <input name="title" value={book.title} onChange={handleChange} placeholder="Title" required />
      <input name="author" value={book.author} onChange={handleChange} placeholder="Author" required />
      <textarea name="description" value={book.description} onChange={handleChange} placeholder="Description" />
      <input name="published_year" type="number" value={book.published_year} onChange={handleChange} placeholder="Published Year" />
      <input name="publisher" value={book.publisher} onChange={handleChange} placeholder="Publisher" />
      <button type="submit">{editingBook ? 'Update Book' : 'Add Book'}</button>
    </form>
  );
};

export default AddBookForm;