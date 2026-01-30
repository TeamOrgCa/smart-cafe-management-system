import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import UpdateOrderStatus from '@/components/UpdateOrderStatus2';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const supabase = await createClient();
  const { id } = await params;

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (name, price, category)
      )
    `)
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  // Fetch staff info separately
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name');
  
  const staffUser = users?.find(u => u.id === order.staff_id);
  const isCustomerOrder = order.staff_id === '00000000-0000-0000-0000-000000000000';

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/dashboard/orders" className="text-olive hover:text-forest mb-4 inline-flex items-center gap-2">
          ← Back to Orders
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-forest mb-2">Order Details</h1>
            <p className="text-olive">Order #{order.order_number}</p>
          </div>
          {isCustomerOrder && (
            <span className="bg-cream text-forest px-4 py-2 rounded-lg font-medium">
              🛒 Customer Self-Order
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-forest mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b border-olive/20 pb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-forest">{item.menu_items.name}</p>
                    <p className="text-sm text-olive">{item.menu_items.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₱{item.price.toFixed(2)} × {item.quantity}</p>
                    <p className="text-sm text-olive">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t-2 border-forest">
              <div className="flex justify-between items-center text-2xl font-bold text-forest">
                <span>Total:</span>
                <span>₱{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-forest mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-olive">Customer Name</p>
                <p className="font-semibold">{order.customer_name || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-sm text-olive">Order Type</p>
                <p className="font-semibold">
                  {isCustomerOrder ? 'Self-Service' : 'Staff Created'}
                </p>
              </div>
              {!isCustomerOrder && staffUser && (
                <div>
                  <p className="text-sm text-olive">Created By</p>
                  <p className="font-semibold">{staffUser.full_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-forest mb-4">Payment & Status</h3>
            
            {/* Payment Amount */}
            <div className="mb-6 p-4 bg-beige rounded-lg">
              <p className="text-sm text-olive mb-1">Total Amount to Collect</p>
              <p className="text-3xl font-bold text-forest">₱{order.total_amount.toFixed(2)}</p>
            </div>

            {/* Status Indicator */}
            <div className="mb-6">
              <p className="text-sm text-olive mb-2">Current Status</p>
              <span
                className={`inline-block px-4 py-2 rounded-lg font-semibold text-lg ${
                  order.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'pending'
                    ? 'bg-cream text-forest'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.status === 'pending' && '⏳ Pending Payment'}
                {order.status === 'completed' && '✅ Completed'}
                {order.status === 'cancelled' && '❌ Cancelled'}
              </span>
            </div>

            {/* Payment Instructions */}
            {order.status === 'pending' && (
              <div className="mb-6 p-4 bg-cream/50 rounded-lg border-l-4 border-forest">
                <p className="font-semibold text-forest mb-2">💡 Payment Instructions:</p>
                <ol className="text-sm text-olive space-y-1 list-decimal list-inside">
                  <li>Collect ₱{order.total_amount.toFixed(2)} from customer</li>
                  <li>Process payment (cash/card/e-wallet)</li>
                  <li>Mark order as "Completed" below</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <p className="text-sm text-olive mb-3">Update Order Status:</p>
              <UpdateOrderStatus 
                orderId={order.id} 
                currentStatus={order.status} 
                totalAmount={order.total_amount}
                orderNumber={order.order_number}
                customerName={order.customer_name || 'Walk-in'}
                orderItems={order.order_items || []}
                orderDate={order.created_at}
              />
            </div>

            {/* Timestamps */}
            <div className="mt-4 pt-4 border-t border-olive/20">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-olive">Created</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-olive">Last Updated</p>
                  <p className="font-medium">
                    {new Date(order.updated_at).toLocaleDateString()} at{' '}
                    {new Date(order.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
