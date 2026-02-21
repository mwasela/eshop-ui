"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, ChevronDown, Folder, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import AuthGuard from './AuthGuard';
import axiosInstance from '@/helpers/axios';
// Removed FieldMoney import, using DollarSign from lucide-react

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== '/' && pathname !== '/login';
  

  const [user, setUser] = useState(null);

  return (
    <div className="flex min-h-screen">
      {showSidebar && (
        <nav className="w-64 h-screen sticky top-0 bg-white border-r border-zinc-200 p-6 flex flex-col gap-4 shadow-sm overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold">A</div>
            <span className="text-2xl font-bold tracking-tight text-blue-700">AutoSpares</span>
          </div>

          <SidebarLink href="/home" icon={<Home size={20} />} label="Home" pathname={pathname} />
          <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" pathname={pathname} />
          <SidebarLink href="/sales" icon={<DollarSign size={20} />} label="Sales" pathname={pathname} />

          <MastersNav pathname={pathname} />
        </nav>
      )}

      <main className={showSidebar ? "flex-1 p-8" : "w-full"}>
        <AuthGuard>{children}</AuthGuard>
      </main>
    </div>
  );
}

// Sub-component for the Dropdown
function MastersNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(pathname.startsWith('/masters'));
  const mastersLinks = [
    { href: '/masters/inventory', label: 'Inventory' },
    { href: '/masters/pricelist', label: 'Pricelist' },
    { href: '/masters/customers', label: 'Customers' },
    { href: '/masters/suppliers', label: 'Suppliers' },
    { href: '/masters/products', label: 'Products' },
    { href: '/masters/categories', label: 'Categories' },
  ];

  const isActive = pathname.startsWith('/masters');

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 w-full ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
      >
        <Folder size={20} />
        <span>Masters</span>
        <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-zinc-100 pl-4">
          {mastersLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              isSublink
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Generic Link Component
function SidebarLink({ href, icon, label, pathname, isSublink = false }: {
  href: string; icon?: React.ReactNode; label: string; pathname: string; isSublink?: boolean
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium ${isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        } ${isSublink ? 'text-sm' : ''}`}
    >
      {icon && icon}
      <span>{label}</span>
    </Link>
  );
}