'use client';

import { useState, useMemo } from 'react';

interface MenuLog {
  id: string;
  menu_item_name: string;
  operation_type: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  user_name: string | null;
  notes: string | null;
  created_at: string;
}

interface MenuLogsProps {
  logs: MenuLog[];
  onClose: () => void;
}

export default function MenuLogs({ logs, onClose }: MenuLogsProps) {
  const [filters, setFilters] = useState({
    search: '',
    operationType: 'all',
    sortBy: 'date-desc',
  });

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      // Search filter
      if (filters.search && !log.menu_item_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Operation type filter
      if (filters.operationType !== 'all' && log.operation_type !== filters.operationType) {
        return false;
      }

      return true;
    });

    // Sort
    if (filters.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filters.sortBy === 'item-asc') {
      filtered.sort((a, b) => a.menu_item_name.localeCompare(b.menu_item_name));
    } else if (filters.sortBy === 'item-desc') {
      filtered.sort((a, b) => b.menu_item_name.localeCompare(a.menu_item_name));
    }

    return filtered;
  }, [logs, filters]);

  const getOperationBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      create: { bg: 'bg-green-100', text: 'text-green-800', label: '➕ Created' },
      update_price: { bg: 'bg-blue-100', text: 'text-blue-800', label: '💰 Price Update' },
      update_availability: { bg: 'bg-purple-100', text: 'text-purple-800', label: '🔄 Availability' },
      update_details: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '✏️ Details Update' },
      delete: { bg: 'bg-red-100', text: 'text-red-800', label: '🗑️ Deleted' },
    };
    const badge = badges[type] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-forest text-white px-4 lg:px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg lg:text-xl font-semibold">📋 Menu Change Log</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 lg:p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Search Item
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Menu item name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
              />
            </div>

            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Operation Type
              </label>
              <select
                value={filters.operationType}
                onChange={(e) => setFilters({ ...filters, operationType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
              >
                <option value="all">All Operations</option>
                <option value="create">Created</option>
                <option value="update_price">Price Updates</option>
                <option value="update_availability">Availability Changes</option>
                <option value="update_details">Details Updates</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
              >
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="item-asc">Item Name (A-Z)</option>
                <option value="item-desc">Item Name (Z-A)</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing <span className="font-bold text-forest">{filteredLogs.length}</span> of {logs.length} logs
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filteredLogs.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Menu Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Operation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Field Changed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Old Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">New Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{log.menu_item_name}</td>
                        <td className="px-4 py-3 text-sm">{getOperationBadge(log.operation_type)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.field_changed || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.old_value || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-forest">{log.new_value || '-'}</td>
                        <td className="px-4 py-3 text-sm">{log.user_name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-forest">{log.menu_item_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      {getOperationBadge(log.operation_type)}
                    </div>
                    <div className="space-y-1 text-sm">
                      {log.field_changed && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Field:</span>
                          <span className="font-medium">{log.field_changed}</span>
                        </div>
                      )}
                      {log.old_value && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Old:</span>
                          <span className="text-red-600">{log.old_value}</span>
                        </div>
                      )}
                      {log.new_value && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">New:</span>
                          <span className="text-green-600">{log.new_value}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">User:</span>
                        <span>{log.user_name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              No logs found matching your filters
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
