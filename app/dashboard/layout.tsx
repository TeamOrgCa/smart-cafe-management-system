import { getUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-beige">
      <Sidebar userRole={profile.role} userName={profile.full_name} />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
