import { requireAuth, getUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-forest mb-2">Welcome back, {profile.full_name}!</h1>
        <p className="text-olive text-lg">Here's what's happening in your café today</p>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Orders Card */}
          <Link href="/dashboard/orders">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-forest">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-forest">Orders</h2>
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-olive">Process and manage customer orders</p>
            </div>
          </Link>

          {/* Menu Card */}
          {isAdmin && (
            <Link href="/dashboard/menu">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-forest">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-forest">Menu</h2>
                  <span className="text-3xl">🍽️</span>
                </div>
                <p className="text-olive">Manage menu items and pricing</p>
              </div>
            </Link>
          )}

          {/* Inventory Card */}
          {isAdmin && (
            <Link href="/dashboard/inventory">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-forest">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-forest">Inventory</h2>
                  <span className="text-3xl">📦</span>
                </div>
                <p className="text-olive">Track stock levels and supplies</p>
              </div>
            </Link>
          )}

          {/* Reports Card */}
          {isAdmin && (
            <Link href="/dashboard/reports">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-forest">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-forest">Reports</h2>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-olive">View sales and performance reports</p>
              </div>
            </Link>
          )}

          {/* Staff Management Card */}
          {isAdmin && (
            <Link href="/dashboard/staff">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-forest">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-forest">Staff</h2>
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-olive">Manage staff accounts</p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
