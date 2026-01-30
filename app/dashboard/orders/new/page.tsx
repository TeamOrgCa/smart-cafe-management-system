import { requireAuth, getCurrentUser } from '@/lib/auth';
import CreateOrderForm from '@/components/CreateOrderForm';
import Link from 'next/link';

export default async function NewOrderPage() {
  await requireAuth();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/dashboard/orders" className="text-olive hover:text-forest mb-4 inline-flex items-center gap-2">
          ← Back to Orders
        </Link>
        <h1 className="text-4xl font-bold text-forest mb-2">Create New Order</h1>
        <p className="text-olive">Select items to add to the order</p>
      </div>

      <CreateOrderForm userId={user.id} />
    </div>
  );
}
