import React from 'react';
import { Book } from '../interfaces/Book';

interface BookListProps {
  books: Book[];
  onDelete: (id: number) => void;
  onEdit: (book: Book) => void;
}

const BookList: React.FC<BookListProps> = ({ books, onDelete, onEdit }) => {
  return (
    <div>
      <h2>Book List</h2>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <div>
              <strong>{book.title}</strong> by {book.author}
            </div>
            <div>{book.description}</div>
            <div>
              Published in {book.published_year} by {book.publisher}
            </div>
            <button onClick={() => onEdit(book)}>Edit</button>
            <button onClick={() => onDelete(book.id!)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookList;