import { createClient } from '@/lib/supabase/server'
import TransactionList from '@/components/TransactionList'

export default async function TransactionsPage() {
  const supabase = await createClient()
  
  // Fetch all orders with related data
  const { data: orders, error } = await supabase
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
    .order('created_at', { ascending: false })
  
  // Fetch all users (staff/admin) for the cashier filter
  const { data: users } = await supabase
    .from('users')
    .select('id, username, role')
    .order('username')

  if (error) {
    console.error('Error fetching orders:', error)
    return <div className="p-6">Error loading transactions</div>
  }

  // Calculate simple counts
  const totalOrders = orders?.length || 0
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
  const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0

  // Create user map for easier lookup
  const userMap = new Map<string, string>()
  users?.forEach(user => {
    userMap.set(user.id, user.username)
  })

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-forest-900 mb-2">📜 Transaction History</h1>
        <p className="text-sm lg:text-base text-forest-600">Complete audit trail and logbook of all orders</p>
      </div>

      {/* Simple Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600">Total Orders</p>
          <p className="text-2xl lg:text-3xl font-bold text-forest-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600">Completed</p>
          <p className="text-2xl lg:text-3xl font-bold text-green-600">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <p className="text-xs lg:text-sm text-forest-600">Cancelled</p>
          <p className="text-2xl lg:text-3xl font-bold text-red-600">{cancelledOrders}</p>
        </div>
      </div>

      {/* Transaction List with Filters */}
      <TransactionList transactions={orders || []} userMap={userMap} />
    </div>
  )
}
