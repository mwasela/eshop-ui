//import Link from 'next/link';
import { Link } from "lucide-react";



export default function SidebarLink({ href, icon, label, pathname, isSublink = false, collapsed }: {
  href: string; icon?: React.ReactNode; label: string; pathname: string; isSublink?: boolean; collapsed: boolean
}) {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium
        ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        } 
        ${isSublink ? 'text-sm' : ''}
        ${collapsed ? 'justify-center px-0' : ''}
      `}
      title={collapsed ? label : ""}
    >
      <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}