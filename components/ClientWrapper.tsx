
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard, 
  Menu,
  Users, 
  ChevronDown, 
  Folder, 
  DollarSign, 
  LogOut, 
  X,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import AuthGuard from './AuthGuard';
import axiosInstance from '@/helpers/axios';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showSidebar = pathname !== '/' && pathname !== '/login';
  
  const [user, setUser] = useState<{ username: string; email: string } | null>(null); 
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get('/api/me');
      // Adjust based on your Go controller response structure 
      // (we used gin.H{"data": ...} in the previous step)
      setUser(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    if (showSidebar) {
      fetchUser();
    }
  }, [showSidebar]);

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: <UserIcon size={14} />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      danger: true,
      label: 'Logout',
      icon: <LogOut size={14} />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {showSidebar && (
        <>
          {isMobile && sidebarOpen ? (
            <div
              className="fixed inset-0 bg-black/35 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <nav
            className={`
              bg-white border-r border-zinc-200 p-6 flex flex-col gap-4 shadow-sm overflow-y-auto
              ${isMobile
                ? `fixed top-0 left-0 h-screen w-72 max-w-[85vw] z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                : 'w-64 h-screen sticky top-0'
              }
            `}
          >
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold">S</div>
                <span className="text-2xl font-bold tracking-tight text-blue-700">SpareHub</span>
              </div>

              {isMobile ? (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-zinc-600 hover:bg-zinc-100"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <SidebarLink href="/home" icon={<Home size={20} />} label="Home" pathname={pathname} onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" pathname={pathname} onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
            <SidebarLink href="/sales" icon={<DollarSign size={20} />} label="Sales" pathname={pathname} onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />

            <MastersNav pathname={pathname} onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
            <AdminNav pathname={pathname} onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
          </nav>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {showSidebar && (
          <header className="h-16 bg-white border-b border-zinc-200 sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 text-zinc-500 font-medium">
              {isMobile ? (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-zinc-600 hover:bg-zinc-100"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>
              ) : null}

              <span>{pathname.split('/').pop()?.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-6">
              <button className="text-zinc-400 hover:text-blue-600 transition-colors">
                <Bell size={20} />
              </button>
              
              <div className="h-8 w-[1px] bg-zinc-200" />

              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <button className="flex items-center gap-3 hover:bg-zinc-50 p-1 rounded-lg transition-colors group">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-zinc-800 leading-none">
                      {user?.username || 'Loading...'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {user?.email || 'User'}
                    </p>
                  </div>
                  <Avatar 
                    style={{ backgroundColor: '#1d4ed8' }} 
                    icon={<UserIcon size={18} />} 
                  />
                  <ChevronDown size={14} className="text-zinc-400 group-hover:text-zinc-600" />
                </button>
              </Dropdown>
            </div>
          </header>
        )}

        <main className={showSidebar ? "p-4 md:p-8" : "w-full"}>
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (MastersNav, AdminNav, SidebarLink remain largely the same) ---

function MastersNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(pathname.startsWith('/masters') && !pathname.includes('locations') && !pathname.includes('companies'));
  const mastersLinks = [
    { href: '/masters/inventory', label: 'Inventory' },
    { href: '/masters/pricelist', label: 'Pricelist' },
    { href: '/masters/customers', label: 'Customers' },
    { href: '/masters/suppliers', label: 'Suppliers' },
    { href: '/masters/products', label: 'Products' },
    { href: '/masters/categories', label: 'Categories' },
    { href: '/masters/stores', label: 'Stores' },
  ];

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 w-full ${pathname.startsWith('/masters') ? 'bg-blue-50 text-blue-700' : ''}`}
      >
        <Folder size={20} />
        <span>Masters</span>
        <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-zinc-100 pl-4">
          {mastersLinks.map((link) => (
            <SidebarLink key={link.href} href={link.href} label={link.label} pathname={pathname} isSublink onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(pathname.includes('locations') || pathname.includes('companies') || pathname.includes('users'));
  const adminLinks = [
    { href: '/masters/locations', label: 'Locations' },
    { href: '/masters/companies', label: 'Companies' },
    { href: '/masters/users', label: 'System Users' },
  ];

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 w-full ${open ? 'bg-blue-50 text-blue-700' : ''}`}
      >
        <Users size={20} />
        <span>Site Admin</span>
        <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-zinc-100 pl-4">
          {adminLinks.map((link) => (
            <SidebarLink key={link.href} href={link.href} label={link.label} pathname={pathname} isSublink onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ href, icon, label, pathname, isSublink = false, onNavigate }: {
  href: string; icon?: React.ReactNode; label: string; pathname: string; isSublink?: boolean; onNavigate?: () => void
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
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





// "use client";

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Home, LayoutDashboard, Users, ChevronDown, Folder, DollarSign } from 'lucide-react';
// import { useState, useEffect } from 'react';
// import AuthGuard from './AuthGuard';
// import axiosInstance from '@/helpers/axios';
// // Removed FieldMoney import, using DollarSign from lucide-react

// export default function ClientWrapper({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const showSidebar = pathname !== '/' && pathname !== '/login';
  

//   const [user, setUser] = useState(null); 


//   const fetchUser = async () => {
//     try {
//       const currentUser = await axiosInstance.get('/api/me');
//       console.log("Fetched user:", currentUser.data);
//       setUser(currentUser.data);
//     } catch (error) {
//       console.error('Failed to fetch user:', error);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);


//   return (
//     <div className="flex min-h-screen">
//       {showSidebar && (
//         <nav className="w-64 h-screen sticky top-0 bg-white border-r border-zinc-200 p-6 flex flex-col gap-4 shadow-sm overflow-y-auto">
//           <div className="flex items-center gap-3 mb-8">
//             <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold">S</div>
//             <span className="text-2xl font-bold tracking-tight text-blue-700">SpareHub</span>
//           </div>

//           <SidebarLink href="/home" icon={<Home size={20} />} label="Home" pathname={pathname} />
//           <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" pathname={pathname} />
//           <SidebarLink href="/sales" icon={<DollarSign size={20} />} label="Sales" pathname={pathname} />

//           <MastersNav pathname={pathname} />
//           <AdminNav pathname={pathname} />
//         </nav>
//       )}

//       <main className={showSidebar ? "flex-1 p-8" : "w-full"}>
//         <AuthGuard>{children}</AuthGuard>
//       </main>
//     </div>
//   );
// }

// // Sub-component for the Masters Dropdown
// function MastersNav({ pathname }: { pathname: string }) {
//   const [open, setOpen] = useState(pathname.startsWith('/masters'));
//   const mastersLinks = [
//     { href: '/masters/inventory', label: 'Inventory' },
//     { href: '/masters/pricelist', label: 'Pricelist' },
//     { href: '/masters/customers', label: 'Customers' },
//     { href: '/masters/suppliers', label: 'Suppliers' },
//     { href: '/masters/products', label: 'Products' },
//     { href: '/masters/categories', label: 'Categories' },
//     { href: '/masters/stores', label: 'Stores' },
//   ];

//   const isActive = pathname.startsWith('/masters');

//   return (
//     <div className="flex flex-col gap-1">
//       <button
//         onClick={() => setOpen(!open)}
//         className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 w-full ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
//       >
//         <Folder size={20} />
//         <span>Masters</span>
//         <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
//       </button>

//       {open && (
//         <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-zinc-100 pl-4">
//           {mastersLinks.map((link) => (
//             <SidebarLink
//               key={link.href}
//               href={link.href}
//               label={link.label}
//               pathname={pathname}
//               isSublink
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // Sub-component for the Admin Dropdown
// function AdminNav({ pathname }: { pathname: string }) {
//   const [open, setOpen] = useState(pathname.startsWith('/masters/locations') || pathname.startsWith('/masters/companies'));
//   const adminLinks = [
//     { href: '/masters/locations', label: 'Locations' },
//     { href: '/masters/companies', label: 'Companies' },
//     { href: '/masters/users', label: 'System Users' },
//   ];

//   const isActive = pathname.startsWith('/masters/locations') || pathname.startsWith('/masters/companies');

//   return (
//     <div className="flex flex-col gap-1">
//       <button
//         onClick={() => setOpen(!open)}
//         className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 w-full ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
//       >
//         <Users size={20} />
//         <span>Site Admin</span>
//         <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
//       </button>

//       {open && (
//         <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-zinc-100 pl-4">
//           {adminLinks.map((link) => (
//             <SidebarLink
//               key={link.href}
//               href={link.href}
//               label={link.label}
//               pathname={pathname}
//               isSublink
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // Generic Link Component
// function SidebarLink({ href, icon, label, pathname, isSublink = false }: {
//   href: string; icon?: React.ReactNode; label: string; pathname: string; isSublink?: boolean
// }) {
//   const isActive = pathname === href;
//   return (
//     <Link
//       href={href}
//       className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium ${isActive
//           ? 'bg-blue-100 text-blue-700'
//           : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
//         } ${isSublink ? 'text-sm' : ''}`}
//     >
//       {icon && icon}
//       <span>{label}</span>
//     </Link>
//   );
// }
