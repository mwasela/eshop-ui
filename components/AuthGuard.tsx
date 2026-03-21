"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  // useEffect(() => {
  //   // 1. Check for token in localStorage
  //   const token = localStorage.getItem('token');

  //   // 2. If no token and not on a public page, redirect to login
  //   if (!token) {
  //     setAuthorized(false);
  //     router.push('/login');
  //   } else {
  //     setAuthorized(true);
  //   }
  // }, [pathname, router]);

  // Show a loading spinner while checking authorization
  // if (!authorized) {
  //   return (
  //     <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
  //       <div className="flex flex-col items-center gap-4">
  //         <Spin size="large" />
  //         <span className="text-zinc-500 font-medium">Verifying session...</span>
  //       </div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
}