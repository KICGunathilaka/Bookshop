import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createExpense } from '../services/expenses';
import { useNotify } from '../contexts/NotificationContext';

export default function Expenses() {
  const { notifySuccess, notifyError } = useNotify();
  const [expenseName, setExpenseName] = useState('');
  const [expenseDate, setExpenseDate] = useState(''); // YYYY-MM-DD
  const [expenseDateObj, setExpenseDateObj] = useState<Date | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!expenseName.trim()) {
      setError('Expense name is required');
      return;
    }
    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum) || amtNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await createExpense({
        expenseName: expenseName.trim(),
        expenseDate: expenseDate || null,
        amount: amtNum,
        note: note || null,
      });
      setMessage('Expense recorded successfully');
      notifySuccess('Expense recorded successfully');
      setExpenseName('');
      setExpenseDate('');
      setAmount('');
      setNote('');
    } catch (err: any) {
      console.error('Create expense error:', err);
      setError(err?.message || 'Failed to record expense');
      notifyError(err?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="products-page">
      <h1>Expenses</h1>
      <div className="products-panel" role="tabpanel">
        <div className="panel-section">
          <h3>Daily Expenses</h3>
          <p>Use the form below to record daily expenses.</p>
        </div>

        {/* Create Expense Form at bottom */}
        <div className="panel-section" style={{ marginTop: 16 }}>
          <h3>Create Expense</h3>
          {message && <div className="success-text" style={{ marginBottom: 10 }}>{message}</div>}
          {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="products-filters" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Expense Name</label>
                <input
                  className="text-input"
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g., Utilities, Transport, Stationery"
                />
              </div>
              <div>
                <label>Expense Date</label>
                <DatePicker
                  selected={expenseDateObj}
                  onChange={(date) => {
                    const d = (date as Date | null) || null;
                    setExpenseDateObj(d);
                    setExpenseDate(formatDate(d));
                  }}
                  placeholderText="Select expense date"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  className="react-datepicker-input"
                />
              </div>
              <div>
                <label>Amount</label>
                <input
                  className="text-input"
                  type="number"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label>Note</label>
                <textarea
                  className="text-input"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional notes..."
                ></textarea>
              </div>
            </div>
            <div className="inline-actions" style={{ marginTop: 16 }}>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}