'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

interface SidebarProps {
  userRole: 'admin' | 'staff';
  userName: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { name: 'Orders', path: '/dashboard/orders', icon: '📋' },
  { name: 'Menu', path: '/dashboard/menu', icon: '🍽️', adminOnly: true },
  { name: 'Inventory', path: '/dashboard/inventory', icon: '📦', adminOnly: true },
  { name: 'Transactions', path: '/dashboard/transactions', icon: '💳', adminOnly: true },
  { name: 'Reports', path: '/dashboard/reports', icon: '📊', adminOnly: true },
  { name: 'Staff', path: '/dashboard/staff', icon: '👥', adminOnly: true },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userRole === 'admin';

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-forest text-white p-3 rounded-lg shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-forest text-white z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex flex-col shadow-2xl
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-olive">
          <h1 className="text-2xl font-bold text-cream">Smart Café</h1>
          <p className="text-sm text-white/70 mt-1">Management System</p>
        </div>

        {/* User Info */}
        <div className="p-4 bg-olive/30 border-b border-olive">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-forest font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{userName}</p>
              <span className="text-xs bg-cream text-forest px-2 py-0.5 rounded-full">
                {userRole.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-cream text-forest font-semibold shadow-md'
                          : 'text-white hover:bg-olive/50 hover:translate-x-1'
                      }
                    `}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-base">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-olive space-y-2">
          <Link
            href="/menu"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-olive/50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-xl">👁️</span>
            <span>View Public Menu</span>
          </Link>
          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
