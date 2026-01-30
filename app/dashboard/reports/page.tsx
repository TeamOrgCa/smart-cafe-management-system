import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch all completed orders with items
  const { data: completedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        menu_items (
          id,
          name,
          category
        )
      )
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  // Fetch all orders for cancelled count
  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, status')

  // Calculate KPIs
  const totalRevenue = completedOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const totalOrders = completedOrders?.length || 0;
  const cancelledOrders = allOrders?.filter(o => o.status === 'cancelled').length || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Sales by Payment Method
  const paymentStats = completedOrders?.reduce((acc, order) => {
    const method = order.payment_method || 'Not Specified';
    if (!acc[method]) {
      acc[method] = { count: 0, revenue: 0 };
    }
    acc[method].count += 1;
    acc[method].revenue += order.total_amount;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  // Sales by Category
  const categoryStats = completedOrders?.reduce((acc, order) => {
    order.order_items?.forEach((item: any) => {
      const category = item.menu_items?.category || 'Other';
      if (!acc[category]) {
        acc[category] = { quantity: 0, revenue: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].revenue += item.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  // Top Selling Items
  const itemStats = completedOrders?.reduce((acc, order) => {
    order.order_items?.forEach((item: any) => {
      const itemName = item.menu_items?.name || 'Unknown';
      const itemId = item.menu_items?.id;
      if (itemId) {
        if (!acc[itemId]) {
          acc[itemId] = { name: itemName, quantity: 0, revenue: 0 };
        }
        acc[itemId].quantity += item.quantity;
        acc[itemId].revenue += item.price * item.quantity;
      }
    });
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const topItems = Object.values(itemStats || {})
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  // Peak Hours Analysis
  const hourlyStats = completedOrders?.reduce((acc, order) => {
    const hour = new Date(order.created_at).getHours();
    if (!acc[hour]) {
      acc[hour] = { count: 0, revenue: 0 };
    }
    acc[hour].count += 1;
    acc[hour].revenue += order.total_amount;
    return acc;
  }, {} as Record<number, { count: number; revenue: number }>);

  const peakHours = Object.entries(hourlyStats || {})
    .sort(([, a]: any, [, b]: any) => b.count - a.count)
    .slice(0, 5)
    .map(([hour, stats]: any) => ({
      hour: `${hour}:00 - ${hour}:59`,
      orders: stats.count,
      revenue: stats.revenue
    }));


  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-forest-900 mb-2">📊 Sales Reports & Analytics</h1>
        <p className="text-sm lg:text-base text-forest-600">Key performance indicators and business insights</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600 mb-1">Total Revenue</p>
          <p className="text-2xl lg:text-3xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From completed orders</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600 mb-1">Total Orders</p>
          <p className="text-2xl lg:text-3xl font-bold text-forest-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600 mb-1">Average Order Value</p>
          <p className="text-2xl lg:text-3xl font-bold text-blue-600">₱{averageOrderValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Per completed order</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600 mb-1">Cancelled Orders</p>
          <p className="text-2xl lg:text-3xl font-bold text-red-600">{cancelledOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Voided transactions</p>
        </div>
      </div>

      {/* Sales by Payment Method */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="bg-forest-900 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-t-lg">
          <h2 className="text-lg lg:text-xl font-semibold text-black">💳 Sales by Payment Method</h2>
        </div>
        <div className="p-4 lg:p-6">
          {paymentStats && Object.keys(paymentStats).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(paymentStats).map(([method, stats]: any) => (
                <div key={method} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">{method}</div>
                  <div className="text-xl font-bold text-forest-900">₱{stats.revenue.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{stats.count} orders</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payment data available</p>
          )}
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="bg-forest-900 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-t-lg">
          <h2 className="text-lg lg:text-xl text-black font-semibold">🍽️ Sales by Category</h2>
        </div>
        <div className="p-4 lg:p-6">
          {categoryStats && Object.keys(categoryStats).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryStats)
                .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
                .map(([category, stats]: any) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{category}</div>
                    <div className="text-xl font-bold text-forest-900">₱{stats.revenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{stats.quantity} items sold</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No category data available</p>
          )}
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="bg-forest-900 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-t-lg">
          <h2 className="text-lg lg:text-xl font-semibold text-black">🏆 Top Selling Items</h2>
        </div>
        <div className="p-4 lg:p-6">
          {topItems && topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item: any, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-forest-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-forest-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.quantity} sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-forest-900">₱{item.revenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No sales data available</p>
          )}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="bg-forest-900 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-t-lg">
          <h2 className="text-lg lg:text-xl font-semibold text-black">⏰ Peak Hours</h2>
        </div>
        <div className="p-4 lg:p-6">
          {peakHours && peakHours.length > 0 ? (
            <div className="space-y-3">
              {peakHours.map((slot, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                  <div>
                    <div className="font-semibold text-forest-900">{slot.hour}</div>
                    <div className="text-xs text-gray-500">{slot.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-forest-900">₱{slot.revenue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hourly data available</p>
          )}
        </div>
      </div>

      {/* Link to Transaction History */}
      <div className="bg-cream border border-forest-300 rounded-lg p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-forest-900 mb-2">📜 View Detailed Transactions</h3>
        <p className="text-sm text-forest-600 mb-4">
          Need to see individual order details? Access the complete audit trail with search and filters.
        </p>
        <Link
          href="/dashboard/transactions"
          className="inline-block bg-forest-900 text-white px-6 py-2 rounded-lg hover:bg-forest-800 transition-colors"
        >
          Go to Transaction History
        </Link>
      </div>
    </div>
  );
}
