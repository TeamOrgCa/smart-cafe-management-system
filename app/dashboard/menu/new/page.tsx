import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import MenuForm from '@/components/MenuForm';

export default async function NewMenuItemPage() {
  await requireAdmin();

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/dashboard/menu" className="text-olive hover:text-forest mb-4 inline-flex items-center gap-2">
          ← Back to Menu
        </Link>
        <h1 className="text-4xl font-bold text-forest mb-2">Add New Menu Item</h1>
        <p className="text-olive">Create a new item for your menu</p>
      </div>

      <main>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-forest mb-6">Create Menu Item</h2>
          <MenuForm />
        </div>
      </main>
    </div>
  );
}
