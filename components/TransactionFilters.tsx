'use client';

import { useState } from 'react';

interface TransactionFiltersProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    paymentMethod: string;
    cashier: string;
  }) => void;
  cashiers: { id: string; name: string }[];
}

export default function TransactionFilters({ onFilterChange, cashiers }: TransactionFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [cashier, setCashier] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, status, paymentMethod, cashier });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({ search, status: value, paymentMethod, cashier });
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    onFilterChange({ search, status, paymentMethod: value, cashier });
  };

  const handleCashierChange = (value: string) => {
    setCashier(value);
    onFilterChange({ search, status, paymentMethod, cashier: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
      <h3 className="text-forest font-semibold mb-4 flex items-center gap-2">
        <span>🔍</span>
        <span>Filter & Search</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search by Order ID */}
        <div>
          <label className="block text-sm font-medium text-forest mb-1">
            Search Order #
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ORD-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-forest mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className="block text-sm font-medium text-forest mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
          >
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="maya">Maya</option>
          </select>
        </div>

        {/* Cashier Filter */}
        <div>
          <label className="block text-sm font-medium text-forest mb-1">
            Processed By
          </label>
          <select
            value={cashier}
            onChange={(e) => handleCashierChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
          >
            <option value="all">All</option>
            <option value="self-order">Customer Self-Order</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
